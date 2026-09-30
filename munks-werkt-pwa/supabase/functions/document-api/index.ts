import { createClient } from 'npm:@supabase/supabase-js@2';
import { Pool } from 'jsr:@db/postgres@^0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const pool = new Pool(Deno.env.get('SUPABASE_DB_URL') ?? '', 1);
const bucket = 'participant-documents';
const allowedOrigins = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4175,http://127.0.0.1:4175')
    .split(',').map(value => value.trim()).filter(Boolean),
);

const cors = (origin: string | null) => ({
  'Cache-Control': 'private, no-store',
  'Vary': 'Origin',
  ...(origin && allowedOrigins.has(origin) ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  } : {}),
});
const json = (status: number, body: unknown, origin: string | null) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors(origin), 'Content-Type': 'application/json' },
});
const jwtClaim = (authorization: string, name: string) => {
  try {
    const encoded = authorization.replace(/^Bearer\s+/i, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return (JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))) as Record<string, unknown>)[name];
  } catch { return undefined; }
};
const safeDownloadName = (value: string) => value.replace(/[\r\n"\\/]/g, '_').slice(0, 180) || 'document.pdf';
const isPdf = (bytes: Uint8Array) => {
  const header = new TextDecoder().decode(bytes.slice(0, 5));
  const tail = new TextDecoder().decode(bytes.slice(Math.max(0, bytes.length - 2048)));
  return header === '%PDF-' && tail.includes('%%EOF');
};

Deno.serve(async request => {
  const origin = request.headers.get('Origin');
  if (origin && !allowedOrigins.has(origin)) return json(403, { message: 'Deze herkomst is niet toegestaan.' }, origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (!['GET', 'POST'].includes(request.method)) return json(405, { message: 'Deze methode is niet toegestaan.' }, origin);
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json(401, { message: 'Aanmelden is vereist.' }, origin);

  const userClient = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(401, { message: 'De sessie is ongeldig of verlopen.' }, origin);
  const userId = userData.user.id;
  const sessionId = jwtClaim(authorization, 'session_id');
  const assuranceLevel = jwtClaim(authorization, 'aal');
  if (typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(sessionId)) return json(401, { message: 'De sessie is ongeldig of verlopen.' }, origin);

  const connection = await pool.connect();
  try {
    const access = await connection.queryObject<{ active_session: boolean; active_profile: boolean; mfa_required: boolean }>`
      select
        exists(select 1 from auth.sessions where id=${sessionId}::uuid and user_id=${userId}::uuid) as active_session,
        exists(select 1 from public.profiles where id=${userId}::uuid and account_active) as active_profile,
        coalesce((select mfa_required from public.app_security_settings where singleton limit 1), false) as mfa_required
    `;
    if (!access.rows[0]?.active_session) return json(401, { message: 'De sessie is uitgelogd of verlopen.' }, origin);
    if (!access.rows[0]?.active_profile) return json(403, { message: 'Dit account is niet actief.' }, origin);
    if (access.rows[0]?.mfa_required && assuranceLevel !== 'aal2') return json(403, { code: 'mfa_required', message: 'Voltooi eerst de tweede beveiligingsstap.' }, origin);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    if (request.method === 'GET') {
      const storagePath = new URL(request.url).searchParams.get('path') ?? '';
      // Nieuwe objecten krijgen een UUID.pdf-naam. De ruimere laatste component
      // houdt bestaande, eerder opgeslagen rapporten downloadbaar. Toegang wordt
      // daarna altijd op het volledige, exacte pad in public.documents beslist.
      if (!/^[0-9a-f-]{36}\/talent_report\/[a-zA-Z0-9._-]{1,240}$/.test(storagePath)) return json(400, { message: 'Het documentpad is niet geldig.' }, origin);
      const document = await connection.queryObject<{ display_name: string }>`
        select documents.display_name
        from public.documents
        join public.enrollments on enrollments.id=documents.enrollment_id
        where documents.storage_path=${storagePath} and documents.archived_at is null
          and documents.document_type='talent_report'
          and (
            (enrollments.participant_id=${userId}::uuid and documents.participant_visible)
            or (
              enrollments.primary_coach_id=${userId}::uuid
              and exists(select 1 from public.trajectory_staff where trajectory_run_id=enrollments.trajectory_run_id and user_id=${userId}::uuid and active and role in ('primary_coach','trajectory_coach'))
            )
          )
        limit 1
      `;
      if (!document.rows[0]) return json(404, { message: 'Het document is niet beschikbaar.' }, origin);
      const downloaded = await admin.storage.from(bucket).download(storagePath);
      if (downloaded.error || !downloaded.data) return json(404, { message: 'Het documentbestand is niet gevonden.' }, origin);
      const name = safeDownloadName(document.rows[0].display_name.toLowerCase().endsWith('.pdf') ? document.rows[0].display_name : `${document.rows[0].display_name}.pdf`);
      return new Response(downloaded.data, { headers: {
        ...cors(origin),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "sandbox; default-src 'none'",
      } });
    }

    const form = await request.formData().catch(() => null);
    const enrollmentId = String(form?.get('enrollmentId') ?? '');
    const trajectoryCode = String(form?.get('trajectoryCode') ?? '');
    const file = form?.get('file');
    if (!/^[0-9a-f-]{36}$/i.test(enrollmentId) || !trajectoryCode || !(file instanceof File)) return json(400, { message: 'De documentgegevens zijn niet geldig.' }, origin);
    if (file.size < 8 || file.size > 10 * 1024 * 1024) return json(400, { message: 'Het pdf-bestand mag maximaal 10 MB zijn.' }, origin);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isPdf(bytes)) return json(400, { message: 'Het gekozen bestand is inhoudelijk geen geldig pdf-bestand.' }, origin);
    const allowed = await connection.queryObject<{ allowed: boolean }>`
      select exists(
        select 1 from public.enrollments
        join public.trajectory_runs on trajectory_runs.id=enrollments.trajectory_run_id
        where enrollments.id=${enrollmentId}::uuid and trajectory_runs.code=${trajectoryCode}
          and enrollments.primary_coach_id=${userId}::uuid
          and exists(select 1 from public.trajectory_staff where trajectory_run_id=enrollments.trajectory_run_id and user_id=${userId}::uuid and active and role in ('primary_coach','trajectory_coach'))
      ) as allowed
    `;
    if (!allowed.rows[0]?.allowed) return json(403, { message: 'Je mag voor deze deelnemer geen rapport uploaden.' }, origin);

    const storagePath = `${enrollmentId}/talent_report/${crypto.randomUUID()}.pdf`;
    const uploaded = await admin.storage.from(bucket).upload(storagePath, bytes, { contentType: 'application/pdf', upsert: false, cacheControl: '0' });
    if (uploaded.error) return json(500, { message: 'Het rapport kon niet veilig worden opgeslagen.' }, origin);
    let previousPaths: string[] = [];
    try {
      await connection.queryArray`begin`;
      const previous = await connection.queryObject<{ storage_path: string }>`update public.documents set archived_at=now() where enrollment_id=${enrollmentId}::uuid and document_type='talent_report' and archived_at is null returning storage_path`;
      previousPaths = previous.rows.map(row => row.storage_path);
      await connection.queryObject`
        insert into public.documents(enrollment_id,uploaded_by,document_type,display_name,storage_path,mime_type,file_size_bytes,participant_visible)
        values(${enrollmentId}::uuid,${userId}::uuid,'talent_report',${safeDownloadName(file.name)},${storagePath},'application/pdf',${file.size},false)
      `;
      await connection.queryObject`
        insert into public.talent_test_status(enrollment_id,completed_at,updated_at) values(${enrollmentId}::uuid,now(),now())
        on conflict(enrollment_id) do update set completed_at=now(),results_released_at=null,results_released_by=null,updated_at=now()
      `;
      await connection.queryObject`
        update public.enrollment_steps set status='in_progress',completed_at=null,updated_at=now()
        from public.steps,public.enrollments,public.trajectory_runs
        where enrollment_steps.enrollment_id=${enrollmentId}::uuid and enrollment_steps.step_id=steps.id and steps.step_number=2
          and enrollments.id=enrollment_steps.enrollment_id and trajectory_runs.id=enrollments.trajectory_run_id and steps.program_id=trajectory_runs.program_id
      `;
      await connection.queryArray`commit`;
    } catch (error) {
      await connection.queryArray`rollback`.catch(() => undefined);
      await admin.storage.from(bucket).remove([storagePath]);
      console.error('Documentregistratie mislukt', error);
      return json(500, { message: 'Het rapport kon niet volledig worden geregistreerd.' }, origin);
    }
    if (previousPaths.length) await admin.storage.from(bucket).remove(previousPaths);
    return json(200, { uploaded: true }, origin);
  } finally {
    connection.release();
  }
});
