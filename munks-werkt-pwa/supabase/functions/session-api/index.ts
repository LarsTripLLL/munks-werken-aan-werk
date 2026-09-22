import { createClient } from 'npm:@supabase/supabase-js@2';
import { Pool } from 'jsr:@db/postgres@^0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const pool = new Pool(Deno.env.get('SUPABASE_DB_URL') ?? '', 1);
const allowedOrigins = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4175,http://127.0.0.1:4175')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
);

const responseHeaders = (origin: string | null) => ({
  'Content-Type': 'application/json',
  'Cache-Control': 'private, no-store',
  'Vary': 'Origin',
  ...(origin && allowedOrigins.has(origin) ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  } : {}),
});

const json = (status: number, body: unknown, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) });

const parseDutchDate = (value: string) => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date.getTime()
    : null;
};

const tokenAssuranceLevel = (authorization: string) => {
  try {
    const token = authorization.replace(/^Bearer\s+/i, '');
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    return (JSON.parse(atob(padded)) as { aal?: string }).aal === 'aal2' ? 'aal2' : 'aal1';
  } catch {
    return 'aal1';
  }
};

Deno.serve(async request => {
  const origin = request.headers.get('Origin');
  if (origin && !allowedOrigins.has(origin)) return json(403, { message: 'Deze herkomst is niet toegestaan.' }, origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: responseHeaders(origin) });
  if (request.method !== 'GET' && request.method !== 'POST') return json(405, { message: 'Deze methode is niet toegestaan.' }, origin);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json(401, { message: 'Aanmelden is vereist.' }, origin);

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(401, { message: 'De sessie is ongeldig of verlopen.' }, origin);

  const userId = userData.user.id;
  const connection = await pool.connect();
  try {
    const profileResult = await connection.queryObject<{ first_name: string; last_name: string; email: string; phone: string | null; city: string | null; age_years: number | null; date_of_birth: string | null; calculated_age: number | null; account_active: boolean }>`
      select first_name, last_name, email, phone, city, age_years, date_of_birth::text,
        extract(year from age(current_date, date_of_birth))::int as calculated_age,
        account_active
      from public.profiles
      where id = ${userId}::uuid
      limit 1
    `;
    const profile = profileResult.rows[0];
    if (!profile) return json(403, { message: 'Bij dit account ontbreekt een gebruikersprofiel.' }, origin);
    if (!profile.account_active) return json(403, { message: 'Dit account is niet actief.' }, origin);
    const securitySettings = await connection.queryObject<{ mfa_required: boolean }>`
      select mfa_required from public.app_security_settings where singleton limit 1
    `;
    const mfaRequired = securitySettings.rows[0]?.mfa_required === true;
    if (new URL(request.url).searchParams.get('security') === '1') {
      return json(200, { security: { mfaRequired } }, origin);
    }
    if (mfaRequired && tokenAssuranceLevel(authorization) !== 'aal2') {
      return json(403, { code: 'mfa_required', message: 'Voltooi eerst de tweede beveiligingsstap.' }, origin);
    }
    const commissionerAccess = await connection.queryObject<{ has_commissioner_role: boolean; has_active_organization: boolean }>`
      select
        exists (
          select 1 from public.trajectory_staff
          where user_id = ${userId}::uuid and role = 'rsd_user' and active
        ) as has_commissioner_role,
        exists (
          select 1 from public.trajectory_staff
          join public.trajectory_runs on trajectory_runs.id = trajectory_staff.trajectory_run_id
          join public.organizations on organizations.id = trajectory_runs.organization_id
          where trajectory_staff.user_id = ${userId}::uuid
            and trajectory_staff.role = 'rsd_user'
            and trajectory_staff.active
            and organizations.active
        ) as has_active_organization
    `;
    if (commissionerAccess.rows[0]?.has_commissioner_role && !commissionerAccess.rows[0].has_active_organization && !(
      await connection.queryObject<{ is_admin: boolean }>`select exists(select 1 from public.global_user_roles where user_id=${userId}::uuid and role='functional_admin' and active) as is_admin`
    ).rows[0]?.is_admin) {
      return json(403, { message: 'Deze opdrachtgever is niet actief.' }, origin);
    }
    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as { action?: string; stepNumber?: number; enrollmentId?: string; present?: boolean; active?:boolean; appointmentId?:string; trajectoryCode?: string; activityId?: string; value?: unknown; documentType?: string; displayName?: string; storagePath?: string; mimeType?: string; fileSize?: number; choice?: string; category?: string; summary?: string; status?: string; goals?: string; code?: string; name?: string; email?: string; phone?: string; city?: string; birthDate?: string; coachId?: string; commissionerName?: string; startDate?: string; endDate?: string; coachIds?: unknown; required?:boolean; confirmed?:boolean; targetUserId?:string; managedUser?: {id?:string;name?:string;email?:string;role?:string;organization?:string;commissionerCode?:string;trajectoryCodes?:string[];active?:boolean}; appointment?:{id?:string;trajectoryCode?:string;stepNumber?:number;title?:string;date?:string;startTime?:string;endTime?:string;location?:string;explanation?:string;coachId?:string;participantId?:string} };
      if(body.action==='set_mfa_required'){
        const adminRole=await connection.queryObject<{allowed:boolean}>`select exists(select 1 from public.global_user_roles where user_id=${userId}::uuid and role='functional_admin' and active) as allowed`;
        if(!adminRole.rows[0]?.allowed)return json(403,{message:'Alleen een applicatiebeheerder mag tweestapsverificatie wijzigen.'},origin);
        if(typeof body.required!=='boolean'||body.confirmed!==true)return json(400,{message:'Bevestig deze beveiligingswijziging.'},origin);
        await connection.queryObject`update public.app_security_settings set mfa_required=${body.required},updated_by=${userId}::uuid,updated_at=now() where singleton`;
        await connection.queryObject`insert into public.audit_log(actor_user_id,action,data_category,target_table,target_id,metadata) values(${userId}::uuid,${body.required?'mfa_required_enabled':'mfa_required_disabled'},'security','app_security_settings','global',${JSON.stringify({required:body.required})}::jsonb)`;
        return json(200,{saved:true,mfaRequired:body.required},origin);
      }
      if(body.action==='reset_user_mfa'){
        const adminRole=await connection.queryObject<{allowed:boolean}>`select exists(select 1 from public.global_user_roles where user_id=${userId}::uuid and role='functional_admin' and active) as allowed`;
        if(!adminRole.rows[0]?.allowed)return json(403,{message:'Alleen een applicatiebeheerder mag een authenticator resetten.'},origin);
        if(!body.targetUserId||body.confirmed!==true)return json(400,{message:'Kies een gebruiker en bevestig de identiteitscontrole.'},origin);
        if(body.targetUserId===userId)return json(400,{message:'Je kunt je eigen authenticator niet vanuit deze beheerdersroute resetten.'},origin);
        const target=await connection.queryObject<{exists:boolean}>`select exists(select 1 from public.profiles where id=${body.targetUserId}::uuid) as exists`;
        if(!target.rows[0]?.exists)return json(404,{message:'De gebruiker is niet gevonden.'},origin);
        const admin=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
        const found=await admin.auth.admin.getUserById(body.targetUserId);
        if(found.error||!found.data.user)return json(404,{message:'Het aanmeldaccount is niet gevonden.'},origin);
        const factors=(found.data.user.factors??[]).filter(factor=>factor.factor_type==='totp');
        if(!factors.length)return json(400,{message:'Deze gebruiker heeft nog geen authenticator gekoppeld.'},origin);
        for(const factor of factors){const removed=await admin.auth.admin.mfa.deleteFactor({userId:body.targetUserId,id:factor.id});if(removed.error)return json(500,{message:'De authenticator kon niet volledig worden gereset.'},origin)}
        await connection.queryObject`insert into public.audit_log(actor_user_id,action,data_category,target_table,target_id,metadata) values(${userId}::uuid,'mfa_factor_reset','security','profiles',${body.targetUserId},${JSON.stringify({factorCount:factors.length,identityChecked:true})}::jsonb)`;
        return json(200,{reset:true},origin);
      }
      if(body.action==='set_appointment_active'){
        if(!body.appointmentId||typeof body.active!=='boolean')return json(400,{message:'De afspraakstatus is niet geldig.'},origin);
        const target=await connection.queryObject<{id:string;trajectory_run_id:string;step_id:string;coach_id:string;starts_at:string;ends_at:string;kind:string;participant_id:string|null;allowed:boolean}>`select appointments.id::text,appointments.trajectory_run_id::text,appointments.step_id::text,appointments.coach_id::text,appointments.starts_at::text,appointments.ends_at::text,appointments.kind::text,(select enrollment_id::text from public.appointment_participants where appointment_id=appointments.id limit 1) as participant_id,(exists(select 1 from public.global_user_roles where user_id=${userId}::uuid and role='functional_admin' and active) or exists(select 1 from public.trajectory_staff where trajectory_run_id=appointments.trajectory_run_id and user_id=${userId}::uuid and active and role in ('primary_coach','trajectory_coach'))) as allowed from public.appointments where appointments.id=${body.appointmentId}::uuid limit 1`;
        if(!target.rows[0]?.allowed)return json(403,{message:'Je mag deze afspraak niet wijzigen.'},origin);
        if(body.active){
          const conflict=await connection.queryObject<{duplicate:boolean;overlap:boolean}>`select exists(select 1 from public.appointments where trajectory_run_id=${target.rows[0].trajectory_run_id}::uuid and step_id=${target.rows[0].step_id}::uuid and cancelled_at is null and ((kind='individual' and ${target.rows[0].participant_id}::uuid in (select enrollment_id from public.appointment_participants where appointment_id=appointments.id)) or (kind='group_meeting')) and id<>${body.appointmentId}::uuid) as duplicate,exists(select 1 from public.appointments where coach_id=${target.rows[0].coach_id}::uuid and cancelled_at is null and starts_at<${target.rows[0].ends_at}::timestamptz and ends_at>${target.rows[0].starts_at}::timestamptz and id<>${body.appointmentId}::uuid) as overlap`;
          if(conflict.rows[0]?.duplicate)return json(409,{message:'Voor deze trajectstap bestaat inmiddels een andere actieve afspraak.'},origin);
          if(conflict.rows[0]?.overlap)return json(409,{message:'Deze begeleider heeft op dit tijdstip inmiddels een andere afspraak.'},origin);
        }
        await connection.queryObject`update public.appointments set cancelled_at=case when ${body.active} then null else now() end,cancelled_by=case when ${body.active} then null else ${userId}::uuid end,updated_at=now() where id=${body.appointmentId}::uuid`;
        return json(200,{saved:true},origin);
      }
      if(body.action==='save_appointment'){
        const input=body.appointment;
        if(!input?.trajectoryCode||!input.title?.trim()||!input.coachId||!Number.isInteger(input.stepNumber)||input.stepNumber!<1||input.stepNumber!>7||!/^\d{4}-\d{2}-\d{2}$/.test(input.date??'')||!/^\d{2}:\d{2}$/.test(input.startTime??'')||!/^\d{2}:\d{2}$/.test(input.endTime??''))return json(400,{message:'Vul alle afspraakgegevens geldig in.'},origin);
        if(input.endTime!<=input.startTime!)return json(400,{message:'De eindtijd moet na de begintijd liggen.'},origin);
        const target=await connection.queryObject<{id:string;step_id:string;starts_on:string;ends_on:string;allowed:boolean}>`select trajectory_runs.id::text,steps.id::text as step_id,to_char(trajectory_runs.starts_on,'YYYY-MM-DD') as starts_on,to_char(trajectory_runs.ends_on,'YYYY-MM-DD') as ends_on,(exists(select 1 from public.global_user_roles where user_id=${userId}::uuid and role='functional_admin' and active) or exists(select 1 from public.trajectory_staff own where own.trajectory_run_id=trajectory_runs.id and own.user_id=${userId}::uuid and own.active and own.role in ('primary_coach','trajectory_coach'))) as allowed from public.trajectory_runs join public.steps on steps.program_id=trajectory_runs.program_id and steps.step_number=${input.stepNumber!} and steps.active where trajectory_runs.code=${input.trajectoryCode} limit 1`;
        if(!target.rows[0]?.allowed)return json(403,{message:'Je mag voor dit traject geen afspraken beheren.'},origin);
        if(input.date!<target.rows[0].starts_on||input.date!>target.rows[0].ends_on)return json(400,{message:'De afspraak moet binnen de start- en einddatum van het traject vallen.'},origin);
        let appointmentId=input.id??'';
        const coach=await connection.queryObject<{allowed:boolean}>`select exists(select 1 from public.trajectory_staff where trajectory_run_id=${target.rows[0].id}::uuid and user_id=${input.coachId}::uuid and active and role in ('primary_coach','trajectory_coach')) as allowed`;
        if(!coach.rows[0]?.allowed)return json(400,{message:'Kies een begeleider die aan dit traject is gekoppeld.'},origin);
        const individual=input.stepNumber===2||input.stepNumber===7;
        let participantId=input.participantId;
        if(individual&&!participantId&&appointmentId){const existing=await connection.queryObject<{enrollment_id:string}>`select enrollment_id::text from public.appointment_participants where appointment_id=${appointmentId}::uuid limit 1`;participantId=existing.rows[0]?.enrollment_id}
        if(individual&&!participantId)return json(400,{message:'Kies de deelnemer voor dit individuele gesprek.'},origin);
        if(individual){const participant=await connection.queryObject<{id:string}>`select id::text from public.enrollments where id=${participantId}::uuid and trajectory_run_id=${target.rows[0].id}::uuid and status in ('invited','active','paused') limit 1`;if(!participant.rows.length)return json(400,{message:'De gekozen deelnemer hoort niet bij dit traject.'},origin)}
        const overlap=await connection.queryObject<{exists:boolean}>`select exists(select 1 from public.appointments where coach_id=${input.coachId}::uuid and cancelled_at is null and starts_at<(${input.date+' '+input.endTime}::timestamp at time zone 'Europe/Amsterdam') and ends_at>(${input.date+' '+input.startTime}::timestamp at time zone 'Europe/Amsterdam') and (${appointmentId}='' or id<>${appointmentId||crypto.randomUUID()}::uuid)) as exists`;
        if(overlap.rows[0]?.exists)return json(409,{message:'Deze begeleider heeft op dit tijdstip al een andere afspraak.'},origin);
        const duplicate=await connection.queryObject<{exists:boolean}>`select exists(select 1 from public.appointments where trajectory_run_id=${target.rows[0].id}::uuid and step_id=${target.rows[0].step_id}::uuid and cancelled_at is null and ((${individual} and kind='individual' and exists(select 1 from public.appointment_participants where appointment_id=appointments.id and enrollment_id=${participantId}::uuid)) or (not ${individual} and kind='group_meeting')) and (${appointmentId}='' or id<>${appointmentId||crypto.randomUUID()}::uuid)) as exists`;
        if(duplicate.rows[0]?.exists)return json(409,{message:'Voor deze trajectstap bestaat al een afspraak. Gebruik Wijzigen om die afspraak aan te passen.'},origin);
        if(appointmentId){const updated=await connection.queryObject<{id:string}>`update public.appointments set step_id=${target.rows[0].step_id}::uuid,coach_id=${input.coachId}::uuid,kind=${individual?'individual':'group_meeting'},title=${input.title.trim()},starts_at=(${input.date+' '+input.startTime}::timestamp at time zone 'Europe/Amsterdam'),ends_at=(${input.date+' '+input.endTime}::timestamp at time zone 'Europe/Amsterdam'),location=${input.location?.trim()||null},explanation=${input.explanation?.trim()||null},updated_at=now() where id=${appointmentId}::uuid and trajectory_run_id=${target.rows[0].id}::uuid returning id::text`;if(!updated.rows.length)return json(404,{message:'De afspraak is niet gevonden.'},origin);await connection.queryObject`delete from public.appointment_participants where appointment_id=${appointmentId}::uuid`;}else{const created=await connection.queryObject<{id:string}>`insert into public.appointments(trajectory_run_id,step_id,coach_id,kind,title,starts_at,ends_at,location,explanation) values(${target.rows[0].id}::uuid,${target.rows[0].step_id}::uuid,${input.coachId}::uuid,${individual?'individual':'group_meeting'},${input.title.trim()},(${input.date+' '+input.startTime}::timestamp at time zone 'Europe/Amsterdam'),(${input.date+' '+input.endTime}::timestamp at time zone 'Europe/Amsterdam'),${input.location?.trim()||null},${input.explanation?.trim()||null}) returning id::text`;appointmentId=created.rows[0].id}
        if(individual)await connection.queryObject`insert into public.appointment_participants(appointment_id,enrollment_id) values(${appointmentId}::uuid,${participantId}::uuid) on conflict do nothing`;else await connection.queryObject`insert into public.appointment_participants(appointment_id,enrollment_id) select ${appointmentId}::uuid,id from public.enrollments where trajectory_run_id=${target.rows[0].id}::uuid on conflict do nothing`;
        return json(200,{saved:true,id:appointmentId},origin);
      }
      if(body.action==='save_commissioner'){
        const adminRole=await connection.queryObject<{allowed:boolean}>`select exists(select 1 from public.global_user_roles where user_id=${userId}::uuid and role='functional_admin' and active) as allowed`;if(!adminRole.rows[0]?.allowed)return json(403,{message:'Alleen een applicatiebeheerder mag opdrachtgevers beheren.'},origin);
        const input=(body as unknown as {organization?:{code?:string;name?:string;active?:boolean}}).organization;if(!input?.name?.trim()||!/^[A-Z0-9]+$/.test(input.code??''))return json(400,{message:'Vul een geldige naam en opdrachtgevercode in.'},origin);
        const existing=await connection.queryObject<{name:string}>`select name from public.organizations where code=${input.code} limit 1`;
        await connection.queryObject`insert into public.organizations(name,code,active) values(${input.name.trim()},${input.code},${input.active!==false}) on conflict(code) do update set name=excluded.name,active=excluded.active,updated_at=now()`;
        if(existing.rows[0]?.name&&existing.rows[0].name!==input.name.trim())await connection.queryObject`update public.profiles set organization_name=${input.name.trim()},updated_at=now() where organization_name=${existing.rows[0].name}`;
        return json(200,{saved:true},origin);
      }
      if(body.action==='save_managed_user'){
        const adminRole=await connection.queryObject<{allowed:boolean}>`select exists(select 1 from public.global_user_roles where user_id=${userId}::uuid and role='functional_admin' and active) as allowed`;if(!adminRole.rows[0]?.allowed)return json(403,{message:'Alleen een applicatiebeheerder mag gebruikers beheren.'},origin);
        const input=body.managedUser;if(!input?.name?.trim()||!input.email?.trim()||!['project_leader','coach','commissioner'].includes(input.role??''))return json(400,{message:'Vul geldige gebruikersgegevens in.'},origin);
        if(input.role==='coach'&&!(input.trajectoryCodes?.length))return json(400,{message:'Kies minimaal één traject voor deze begeleider.'},origin);
        if(input.role==='commissioner'){
          if(!input.organization?.trim()||!(input.trajectoryCodes?.length))return json(400,{message:'Kies voor de opdrachtgever minimaal één traject van de geselecteerde organisatie.'},origin);
          for(const code of input.trajectoryCodes){const allowedTrajectory=await connection.queryObject<{allowed:boolean}>`select exists(select 1 from public.trajectory_runs join public.organizations on organizations.id=trajectory_runs.organization_id where trajectory_runs.code=${code} and organizations.name=${input.organization.trim()} and organizations.active) as allowed`;if(!allowedTrajectory.rows[0]?.allowed)return json(400,{message:'Een opdrachtgever kan alleen toegang krijgen tot trajecten van de eigen organisatie.'},origin)}
        }
        const admin=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});let managedId=input.id??'';
        if(managedId===userId&&(input.role!=='project_leader'||input.active===false))return json(400,{message:'Je kunt je eigen beheerdersaccount niet blokkeren of een andere rol geven.'},origin);
        if(managedId&&(input.role!=='project_leader'||input.active===false)){
          const target=await connection.queryObject<{is_admin:boolean}>`select exists(select 1 from public.global_user_roles where user_id=${managedId}::uuid and role='functional_admin' and active) as is_admin`;
          if(target.rows[0]?.is_admin){
            const replacement=await connection.queryObject<{available:boolean}>`select exists(select 1 from public.global_user_roles join public.profiles on profiles.id=global_user_roles.user_id where global_user_roles.role='functional_admin' and global_user_roles.active and profiles.account_active and global_user_roles.user_id<>${managedId}::uuid) as available`;
            if(!replacement.rows[0]?.available)return json(400,{message:'De laatste actieve beheerder kan niet worden geblokkeerd of van rol worden veranderd.'},origin);
          }
        }
        if(!managedId){const invited=await admin.auth.admin.inviteUserByEmail(input.email.trim().toLowerCase(),{redirectTo:origin&&allowedOrigins.has(origin)?origin:undefined});if(invited.error||!invited.data.user){const inviteMessage=invited.error?.message?.toLowerCase().includes('rate limit')?'Er zijn tijdelijk te veel uitnodigingsmails verstuurd. Wacht enige tijd en probeer het daarna opnieuw.':invited.error?.message||'De uitnodiging kon niet worden verstuurd.';return json(409,{message:inviteMessage},origin)}managedId=invited.data.user.id}else{const changed=await admin.auth.admin.updateUserById(managedId,{email:input.email.trim().toLowerCase()});if(changed.error)return json(400,{message:'Het e-mailadres kon niet worden gewijzigd.'},origin)}
        const parts=input.name.trim().split(/\s+/);const first=parts.shift()??'';const last=parts.join(' ')||'-';await connection.queryObject`insert into public.profiles(id,first_name,last_name,email,account_active,organization_name) values(${managedId}::uuid,${first},${last},${input.email.trim().toLowerCase()},${input.active!==false},${input.organization?.trim()||'Munks BV'}) on conflict(id) do update set first_name=excluded.first_name,last_name=excluded.last_name,email=excluded.email,account_active=excluded.account_active,organization_name=excluded.organization_name,updated_at=now()`;
        await connection.queryObject`update public.global_user_roles set active=false,revoked_at=now() where user_id=${managedId}::uuid and role='functional_admin'`;await connection.queryObject`update public.trajectory_staff set active=false,revoked_at=now() where user_id=${managedId}::uuid and role in ('primary_coach','trajectory_coach','rsd_user')`;
        if(input.role==='project_leader')await connection.queryObject`insert into public.global_user_roles(user_id,role,active,revoked_at) values(${managedId}::uuid,'functional_admin',${input.active!==false},null) on conflict(user_id,role) do update set active=excluded.active,revoked_at=null`;
        const staffRole=input.role==='coach'?'trajectory_coach':input.role==='commissioner'?'rsd_user':null;if(staffRole)for(const code of input.trajectoryCodes??[])await connection.queryObject`insert into public.trajectory_staff(trajectory_run_id,user_id,role,active,revoked_at) select id,${managedId}::uuid,${staffRole}::public.app_role,${input.active!==false},null from public.trajectory_runs where code=${code} on conflict(trajectory_run_id,user_id,role) do update set active=excluded.active,revoked_at=null`;
        return json(200,{saved:true},origin);
      }
      if (body.action === 'renew_participant_activation') {
        const isAdmin = await connection.queryObject<{ allowed: boolean }>`select exists(select 1 from public.global_user_roles where user_id=${userId}::uuid and role='functional_admin' and active) as allowed`;
        if(!isAdmin.rows[0]?.allowed||!body.enrollmentId||!body.trajectoryCode)return json(403,{message:'Je mag voor deze deelnemer geen activatiecode maken.'},origin);
        const enrollment=await connection.queryObject<{id:string;email:string}>`select enrollments.id::text,profiles.email from public.enrollments join public.profiles on profiles.id=enrollments.participant_id join public.trajectory_runs on trajectory_runs.id=enrollments.trajectory_run_id where enrollments.id=${body.enrollmentId}::uuid and trajectory_runs.code=${body.trajectoryCode} and enrollments.status='invited' limit 1`;
        if(!enrollment.rows.length)return json(400,{message:'Alleen voor een nog niet geactiveerde deelnemer kan een nieuwe code worden gemaakt.'},origin);
        const activationCode=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');
        await connection.queryObject`update public.activation_invites set used_at=now() where enrollment_id=${body.enrollmentId}::uuid and used_at is null`;
        await connection.queryObject`insert into public.activation_invites(enrollment_id,email,code_hash,expires_at) values(${body.enrollmentId}::uuid,${enrollment.rows[0].email},crypt(${activationCode},gen_salt('bf')),now()+interval '14 days')`;
        return json(200,{activationCode},origin);
      }
      if (body.action === 'create_participant' || body.action === 'update_participant') {
        const isAdmin = await connection.queryObject<{ allowed: boolean }>`select exists(select 1 from public.global_user_roles where user_id = ${userId}::uuid and role = 'functional_admin' and active) as allowed`;
        if (!isAdmin.rows[0]?.allowed) return json(403, { message: 'Alleen een applicatiebeheerder mag deelnemers beheren.' }, origin);
        if (!body.trajectoryCode || !body.name?.trim() || !body.email?.trim() || !body.birthDate || !body.coachId) return json(400, { message: 'Vul naam, e-mailadres, geboortedatum en begeleider in.' }, origin);
        const birthDate = body.birthDate.trim();
        const parsedBirthDate = /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? new Date(`${birthDate}T00:00:00Z`) : new Date(Number.NaN);
        const today = new Date();
        const oldestBirthDate = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
        if (Number.isNaN(parsedBirthDate.getTime()) || parsedBirthDate.toISOString().slice(0, 10) !== birthDate || parsedBirthDate > today || parsedBirthDate < oldestBirthDate) return json(400, { message: 'Vul een geldige geboortedatum in.' }, origin);
        const city = body.city?.trim() || null;
        if (city && city.length > 120) return json(400, { message: 'De woonplaats mag maximaal 120 tekens bevatten.' }, origin);
        const target = await connection.queryObject<{ id: string }>`
          select trajectory_runs.id::text from public.trajectory_runs
          join public.trajectory_staff on trajectory_staff.trajectory_run_id = trajectory_runs.id
          where trajectory_runs.code = ${body.trajectoryCode} and trajectory_staff.user_id = ${body.coachId}::uuid
            and trajectory_staff.active and trajectory_staff.role in ('primary_coach','trajectory_coach') limit 1
        `;
        if (!target.rows.length) return json(400, { message: 'Selecteer een begeleider die aan dit traject is gekoppeld.' }, origin);
        const nameParts = body.name.trim().split(/\s+/); const firstName = nameParts.shift() ?? ''; const lastName = nameParts.join(' ') || '-';
        if (body.action === 'update_participant') {
          if (!body.enrollmentId) return json(400, { message: 'De deelnemer ontbreekt.' }, origin);
          const appointmentConflict = await connection.queryObject<{ conflict: boolean }>`
            select exists (
              select 1
              from public.appointments current_appointment
              join public.appointment_participants on appointment_participants.appointment_id = current_appointment.id
              where appointment_participants.enrollment_id = ${body.enrollmentId}::uuid
                and current_appointment.kind = 'individual'
                and current_appointment.cancelled_at is null
                and current_appointment.starts_at >= now()
                and exists (
                  select 1 from public.appointments other_appointment
                  where other_appointment.coach_id = ${body.coachId}::uuid
                    and other_appointment.cancelled_at is null
                    and other_appointment.id <> current_appointment.id
                    and other_appointment.starts_at < current_appointment.ends_at
                    and other_appointment.ends_at > current_appointment.starts_at
                )
            ) as conflict
          `;
          if (appointmentConflict.rows[0]?.conflict) return json(409, { message: 'De nieuwe begeleider heeft al een afspraak op hetzelfde tijdstip. Wijzig eerst de betreffende afspraak.' }, origin);
          const updated = await connection.queryObject<{ participant_id: string }>`
            update public.enrollments set primary_coach_id = ${body.coachId}::uuid, updated_at = now()
            from public.trajectory_runs where enrollments.id = ${body.enrollmentId}::uuid
              and trajectory_runs.id = enrollments.trajectory_run_id and trajectory_runs.code = ${body.trajectoryCode}
            returning enrollments.participant_id::text
          `;
          if (!updated.rows.length) return json(404, { message: 'De deelnemer is niet gevonden.' }, origin);
          await connection.queryObject`
            update public.appointments set coach_id=${body.coachId}::uuid, updated_at=now()
            where kind='individual' and cancelled_at is null and starts_at>=now()
              and id in (select appointment_id from public.appointment_participants where enrollment_id=${body.enrollmentId}::uuid)
          `;
          await connection.queryObject`update public.profiles set first_name=${firstName}, last_name=${lastName}, email=${body.email.trim().toLowerCase()}, phone=${body.phone?.trim() || null}, city=${city}, date_of_birth=${birthDate}::date, age_years=null, account_active=${body.active!==false}, updated_at=now() where id=${updated.rows[0].participant_id}::uuid`;
          return json(200, { saved: true }, origin);
        }
        if (!serviceRoleKey) return json(500, { message: 'Accountbeheer is nog niet geconfigureerd.' }, origin);
        const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const temporaryPassword = `${crypto.randomUUID()}Aa1!`;
        const createdUser = await adminClient.auth.admin.createUser({ email: body.email.trim().toLowerCase(), password: temporaryPassword, email_confirm: true });
        if (createdUser.error || !createdUser.data.user) return json(409, { message: createdUser.error?.message?.includes('registered') ? 'Er bestaat al een account met dit e-mailadres.' : 'Het account kon niet worden aangemaakt.' }, origin);
        const participantId = createdUser.data.user.id;
        await connection.queryObject`insert into public.profiles(id,first_name,last_name,email,phone,city,date_of_birth) values(${participantId}::uuid,${firstName},${lastName},${body.email.trim().toLowerCase()},${body.phone?.trim() || null},${city},${birthDate}::date)`;
        const enrollment = await connection.queryObject<{ id: string }>`insert into public.enrollments(trajectory_run_id,participant_id,primary_coach_id,status,invited_at) values(${target.rows[0].id}::uuid,${participantId}::uuid,${body.coachId}::uuid,'invited',now()) returning id::text`;
        await connection.queryObject`insert into public.enrollment_steps(enrollment_id,step_id) select ${enrollment.rows[0].id}::uuid,steps.id from public.steps join public.trajectory_runs on trajectory_runs.program_id=steps.program_id where trajectory_runs.id=${target.rows[0].id}::uuid on conflict do nothing`;
      await connection.queryObject`insert into public.appointment_participants(appointment_id,enrollment_id) select appointments.id,${enrollment.rows[0].id}::uuid from public.appointments where appointments.trajectory_run_id=${target.rows[0].id}::uuid and appointments.kind in ('group_meeting','other') on conflict do nothing`;
        const activationCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6,'0');
        await connection.queryObject`insert into public.activation_invites(enrollment_id,email,code_hash,expires_at) values(${enrollment.rows[0].id}::uuid,${body.email.trim().toLowerCase()},crypt(${activationCode},gen_salt('bf')),now()+interval '14 days')`;
        return json(200, { saved: true, activationCode }, origin);
      }
      if (body.action === 'create_trajectory' || body.action === 'update_trajectory') {
        const isAdmin = await connection.queryObject<{ allowed: boolean }>`
          select exists(select 1 from public.global_user_roles where user_id = ${userId}::uuid and role = 'functional_admin' and active) as allowed
        `;
        if (!isAdmin.rows[0]?.allowed) return json(403, { message: 'Alleen een applicatiebeheerder mag trajecten beheren.' }, origin);
        const coachIds = Array.isArray(body.coachIds) ? body.coachIds.filter((id): id is string => typeof id === 'string') : [];
        if (!body.code?.trim() || !body.name?.trim() || !body.startDate || !body.endDate || (body.action === 'create_trajectory' && !body.commissionerName?.trim())) return json(400, { message: 'Vul alle trajectgegevens in.' }, origin);
        const startTime = parseDutchDate(body.startDate);
        const endTime = parseDutchDate(body.endDate);
        if (startTime === null || endTime === null) return json(400, { message: 'Vul geldige datums in als dd-mm-jjjj.' }, origin);
        if (endTime < startTime) return json(400, { message: 'De einddatum mag niet vóór de startdatum liggen.' }, origin);
        let trajectoryId = '';
        if (body.action === 'create_trajectory') {
          const organization = await connection.queryObject<{ id: string }>`select id::text from public.organizations where name = ${body.commissionerName!.trim()} and active limit 1`;
          if (!organization.rows.length) return json(400, { message: 'De gekozen opdrachtgever is niet beschikbaar.' }, origin);
          const existing = await connection.queryObject<{ id: string }>`select id::text from public.trajectory_runs where code = ${body.code.trim()} limit 1`;
          if (existing.rows.length) return json(409, { message: 'Deze trajectcode bestaat al.' }, origin);
          const created = await connection.queryObject<{ id: string }>`
            insert into public.trajectory_runs (program_id, organization_id, code, name, starts_on, ends_on, status)
            select programs.id, ${organization.rows[0].id}::uuid, ${body.code.trim()}, ${body.name.trim()}, to_date(${body.startDate}, 'DD-MM-YYYY'), to_date(${body.endDate}, 'DD-MM-YYYY'), 'planned'::public.trajectory_status
            from public.programs where name = 'Munks Werkt' and active
            returning id::text
          `;
          trajectoryId = created.rows[0]?.id ?? '';
          if (!trajectoryId) return json(500, { message: 'Het programma Munks Werkt is niet beschikbaar.' }, origin);
          await connection.queryObject`insert into public.trajectory_staff (trajectory_run_id, user_id, role) values (${trajectoryId}::uuid, ${userId}::uuid, 'project_leader') on conflict do nothing`;
        } else {
          const outside = await connection.queryObject<{ exists: boolean }>`select exists(select 1 from public.appointments join public.trajectory_runs on trajectory_runs.id = appointments.trajectory_run_id where trajectory_runs.code = ${body.code.trim()} and appointments.cancelled_at is null and (((appointments.starts_at at time zone 'Europe/Amsterdam')::date < to_date(${body.startDate}, 'DD-MM-YYYY')) or ((appointments.ends_at at time zone 'Europe/Amsterdam')::date > to_date(${body.endDate}, 'DD-MM-YYYY')))) as exists`;
          if (outside.rows[0]?.exists) return json(409, { message: 'De nieuwe trajectperiode valt over een bestaande actieve afspraak. Pas eerst die afspraak aan of annuleer haar.' }, origin);
          const updated = await connection.queryObject<{ id: string }>`
            update public.trajectory_runs set name = ${body.name.trim()}, starts_on = to_date(${body.startDate}, 'DD-MM-YYYY'), ends_on = to_date(${body.endDate}, 'DD-MM-YYYY'), updated_at = now()
            where code = ${body.code.trim()}
            returning id::text
          `;
          trajectoryId = updated.rows[0]?.id ?? '';
          if (!trajectoryId) return json(404, { message: 'Het traject is niet gevonden.' }, origin);
        }
        await connection.queryObject`update public.trajectory_staff set active = false, revoked_at = now() where trajectory_run_id = ${trajectoryId}::uuid and role in ('primary_coach', 'trajectory_coach')`;
        for (const coachId of coachIds) await connection.queryObject`
          insert into public.trajectory_staff (trajectory_run_id, user_id, role, active, revoked_at)
          values (${trajectoryId}::uuid, ${coachId}::uuid, 'trajectory_coach', true, null)
          on conflict (trajectory_run_id, user_id, role) do update set active = true, revoked_at = null, assigned_at = now()
        `;
        return json(200, { saved: true, code: body.code.trim() }, origin);
      }
      if (body.action === 'release_outcome') {
        if (!body.enrollmentId || !body.trajectoryCode || !body.category?.trim() || !body.summary?.trim() || !['provisional', 'final'].includes(body.status ?? '') || !['yes', 'partial', 'no', 'not_assessed'].includes(body.goals ?? '')) return json(400, { message: 'Vul een geldig uitstroomadvies en resultaat voor de doelen in.' }, origin);
        const released = await connection.queryObject<{ enrollment_id: string }>`
          update public.enrollments set
            exit_category = ${body.category.trim()}, exit_advice_summary = ${body.summary.trim()},
            exit_advice_status = ${body.status}, exit_advice_released_at = now(),
            exit_advice_released_by = ${userId}::uuid,
            goals_result = ${body.goals}::public.goal_result,
            status = case when ${body.status} = 'final' then 'completed'::public.enrollment_status else 'active'::public.enrollment_status end,
            updated_at = now()
          from public.trajectory_runs, public.trajectory_staff
          where enrollments.id = ${body.enrollmentId}::uuid
            and trajectory_runs.id = enrollments.trajectory_run_id and trajectory_runs.code = ${body.trajectoryCode}
            and trajectory_staff.trajectory_run_id = trajectory_runs.id
            and trajectory_staff.user_id = ${userId}::uuid and trajectory_staff.active
            and trajectory_staff.role in ('primary_coach', 'trajectory_coach')
          returning enrollments.id::text as enrollment_id
        `;
        if (!released.rows.length) return json(403, { message: 'Je mag voor deze deelnemer geen uitstroomadvies vrijgeven.' }, origin);
        await connection.queryObject`
          update public.enrollment_steps set
            status = case when ${body.status} = 'final' then 'completed'::public.step_status else 'in_progress'::public.step_status end,
            completed_at = case when ${body.status} = 'final' then coalesce(completed_at, now()) else null end,
            updated_at = now()
          from public.steps, public.enrollments, public.trajectory_runs
          where enrollment_steps.enrollment_id = ${body.enrollmentId}::uuid
            and enrollment_steps.step_id = steps.id and steps.step_number = 7
            and enrollments.id = enrollment_steps.enrollment_id
            and trajectory_runs.id = enrollments.trajectory_run_id and steps.program_id = trajectory_runs.program_id
        `;
        return json(200, { released: true }, origin);
      }
      if (body.action === 'get_talent_status' || body.action === 'record_talent_consent') {
        if (!body.trajectoryCode) return json(400, { message: 'Het traject ontbreekt.' }, origin);
        const enrollmentResult = await connection.queryObject<{ id: string }>`
          select enrollments.id::text
          from public.enrollments
          join public.trajectory_runs on trajectory_runs.id = enrollments.trajectory_run_id
          where enrollments.participant_id = ${userId}::uuid and trajectory_runs.code = ${body.trajectoryCode}
          limit 1
        `;
        const ownEnrollment = enrollmentResult.rows[0];
        if (!ownEnrollment) return json(403, { message: 'Deze talententest hoort niet bij jouw traject.' }, origin);
        if (body.action === 'record_talent_consent') {
          if (!['accepted', 'discuss'].includes(body.choice ?? '')) return json(400, { message: 'De toestemmingskeuze is niet geldig.' }, origin);
          await connection.queryObject`
            insert into public.talent_test_status (enrollment_id, consent_choice, consent_recorded_at, updated_at)
            values (${ownEnrollment.id}::uuid, ${body.choice}::public.talent_consent_choice, now(), now())
            on conflict (enrollment_id) do update set consent_choice = excluded.consent_choice, consent_recorded_at = now(), updated_at = now()
          `;
          return json(200, { saved: true }, origin);
        }
        const talent = await connection.queryObject<{ completed_at: string | null; results_released_at: string | null }>`
          select completed_at::text, results_released_at::text from public.talent_test_status where enrollment_id = ${ownEnrollment.id}::uuid
        `;
        const current = talent.rows[0];
        return json(200, { status: current?.results_released_at ? 'released' : current?.completed_at ? 'completed' : 'not_started' }, origin);
      }
      if (body.action === 'release_talent_results') {
        if (!body.enrollmentId || !body.trajectoryCode) return json(400, { message: 'De deelnemer of het traject ontbreekt.' }, origin);
        const allowed = await connection.queryObject<{ enrollment_id: string }>`
          select enrollments.id::text as enrollment_id
          from public.enrollments
          join public.trajectory_runs on trajectory_runs.id = enrollments.trajectory_run_id
          join public.trajectory_staff on trajectory_staff.trajectory_run_id = trajectory_runs.id
          join public.documents on documents.enrollment_id = enrollments.id
          where enrollments.id = ${body.enrollmentId}::uuid
            and trajectory_runs.code = ${body.trajectoryCode}
            and trajectory_staff.user_id = ${userId}::uuid and trajectory_staff.active
            and trajectory_staff.role in ('primary_coach', 'trajectory_coach')
            and documents.document_type = 'talent_report' and documents.archived_at is null
          limit 1
        `;
        if (!allowed.rows.length) return json(403, { message: 'Het rapport moet eerst zijn geüpload en je moet aan dit traject gekoppeld zijn.' }, origin);
        await connection.queryObject`
          insert into public.talent_test_status (enrollment_id, completed_at, results_released_at, results_released_by, updated_at)
          values (${body.enrollmentId}::uuid, now(), now(), ${userId}::uuid, now())
          on conflict (enrollment_id) do update set
            completed_at = coalesce(talent_test_status.completed_at, now()),
            results_released_at = now(), results_released_by = ${userId}::uuid, updated_at = now()
        `;
        await connection.queryObject`
          update public.documents set participant_visible = true
          where enrollment_id = ${body.enrollmentId}::uuid
            and document_type = 'talent_report' and archived_at is null
        `;
        await connection.queryObject`
          update public.enrollment_steps set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now()
          from public.steps, public.enrollments, public.trajectory_runs
          where enrollment_steps.enrollment_id = ${body.enrollmentId}::uuid
            and enrollment_steps.step_id = steps.id and steps.step_number = 2
            and enrollments.id = enrollment_steps.enrollment_id
            and trajectory_runs.id = enrollments.trajectory_run_id and steps.program_id = trajectory_runs.program_id
        `;
        return json(200, { released: true }, origin);
      }
      if (body.action === 'register_document') {
        if (!body.enrollmentId || !body.trajectoryCode || body.documentType !== 'talent_report' || !body.displayName || !body.storagePath || body.mimeType !== 'application/pdf' || !body.fileSize || body.fileSize > 10485760) {
          return json(400, { message: 'De documentgegevens zijn niet geldig.' }, origin);
        }
        if (!body.storagePath.startsWith(`${body.enrollmentId}/talent_report/`)) return json(400, { message: 'Het opslagpad is niet geldig.' }, origin);
        const allowed = await connection.queryObject<{ enrollment_id: string }>`
          select enrollments.id::text as enrollment_id
          from public.enrollments
          join public.trajectory_runs on trajectory_runs.id = enrollments.trajectory_run_id
          join public.trajectory_staff on trajectory_staff.trajectory_run_id = trajectory_runs.id
          where enrollments.id = ${body.enrollmentId}::uuid
            and trajectory_runs.code = ${body.trajectoryCode}
            and trajectory_staff.user_id = ${userId}::uuid
            and trajectory_staff.active
            and trajectory_staff.role in ('primary_coach', 'trajectory_coach')
          limit 1
        `;
        if (!allowed.rows.length) return json(403, { message: 'Je mag voor deze deelnemer geen rapport uploaden.' }, origin);
        await connection.queryObject`
          update public.documents set archived_at = now()
          where enrollment_id = ${body.enrollmentId}::uuid and document_type = 'talent_report' and archived_at is null
        `;
        await connection.queryObject`
          insert into public.documents (enrollment_id, uploaded_by, document_type, display_name, storage_path, mime_type, file_size_bytes, participant_visible)
          values (${body.enrollmentId}::uuid, ${userId}::uuid, 'talent_report', ${body.displayName}, ${body.storagePath}, ${body.mimeType}, ${body.fileSize}, false)
        `;
        await connection.queryObject`
          insert into public.talent_test_status (enrollment_id, completed_at, updated_at)
          values (${body.enrollmentId}::uuid, now(), now())
          on conflict (enrollment_id) do update set completed_at = now(),
            results_released_at = null, results_released_by = null, updated_at = now()
        `;
        await connection.queryObject`
          update public.enrollment_steps set status = 'in_progress', completed_at = null, updated_at = now()
          from public.steps, public.enrollments, public.trajectory_runs
          where enrollment_steps.enrollment_id = ${body.enrollmentId}::uuid
            and enrollment_steps.step_id = steps.id and steps.step_number = 2
            and enrollments.id = enrollment_steps.enrollment_id
            and trajectory_runs.id = enrollments.trajectory_run_id and steps.program_id = trajectory_runs.program_id
        `;
        return json(200, { registered: true }, origin);
      }
      if (body.action === 'get_answer' || body.action === 'save_answer') {
        if (!body.trajectoryCode || !body.activityId) return json(400, { message: 'Het traject of onderdeel ontbreekt.' }, origin);
        const target = await connection.queryObject<{ enrollment_id: string; content_id: string }>`
          select enrollments.id::text as enrollment_id, step_content.id::text as content_id
          from public.enrollments
          join public.trajectory_runs on trajectory_runs.id = enrollments.trajectory_run_id
          join public.steps on steps.program_id = trajectory_runs.program_id and steps.active
          join public.step_content on step_content.step_id = steps.id and step_content.active
          where enrollments.participant_id = ${userId}::uuid
            and enrollments.status in ('invited', 'active', 'paused')
            and trajectory_runs.code = ${body.trajectoryCode}
            and step_content.content_key = ${body.activityId}
          limit 1
        `;
        const ids = target.rows[0];
        if (!ids) return json(403, { message: 'Dit onderdeel hoort niet bij jouw actieve traject.' }, origin);
        if (body.action === 'get_answer') {
          const answer = await connection.queryObject<{ answer_text: string | null; answer_data: unknown; skipped: boolean; updated_at: string }>`
            select answer_text, answer_data, skipped, updated_at::text
            from public.answers
            where enrollment_id = ${ids.enrollment_id}::uuid and content_id = ${ids.content_id}::uuid
            limit 1
          `;
          const saved = answer.rows[0];
          return json(200, { answer: saved ? { value: saved.skipped ? {} : saved.answer_data ?? saved.answer_text ?? '', updatedAt: saved.updated_at } : null }, origin);
        }
        const isText = typeof body.value === 'string';
        const hasValue = isText
          ? body.value.trim().length > 0
          : Array.isArray(body.value)
            ? body.value.length > 0
            : !!body.value && typeof body.value === 'object' && Object.values(body.value as Record<string, unknown>).some(value => String(value ?? '').trim().length > 0);
        const answerText = isText && hasValue ? body.value : null;
        const answerData = !isText && hasValue ? JSON.stringify(body.value) : null;
        const saved = await connection.queryObject<{ id: string }>`
          insert into public.answers (enrollment_id, content_id, answer_text, answer_data, skipped, saved_at, updated_at)
          values (${ids.enrollment_id}::uuid, ${ids.content_id}::uuid, ${answerText}, ${answerData}::jsonb, ${!hasValue}, now(), now())
          on conflict (enrollment_id, content_id) do update set
            answer_text = excluded.answer_text,
            answer_data = excluded.answer_data,
            skipped = excluded.skipped,
            updated_at = now()
          returning id::text
        `;
        await connection.queryObject`
          insert into public.audit_log (actor_user_id, enrollment_id, action, data_category, target_table, target_id)
          values (${userId}::uuid, ${ids.enrollment_id}::uuid, 'answer_saved', 'trajectory_answer', 'answers', ${saved.rows[0].id})
        `;
        return json(200, { saved: true }, origin);
      }
      if (!Number.isInteger(body.stepNumber) || Number(body.stepNumber) < 1 || Number(body.stepNumber) > 7) {
        return json(400, { message: 'De aangeleverde stap is niet geldig.' }, origin);
      }
      if (body.action === 'set_attendance') {
        if (!body.enrollmentId || typeof body.present !== 'boolean' || ![1, 2, 4, 6, 7].includes(Number(body.stepNumber))) {
          return json(400, { message: 'De aanwezigheidsregistratie is niet geldig.' }, origin);
        }
        const attendance = await connection.queryObject<{ enrollment_id: string }>`
          update public.enrollment_steps
          set
            attendance = ${body.present ? 'present' : 'absent'}::public.attendance_status,
            status = case when ${body.present} then 'completed'::public.step_status else 'skipped'::public.step_status end,
            completed_at = coalesce(completed_at, now()),
            updated_at = now()
          from public.enrollments, public.steps, public.trajectory_staff
          where enrollment_steps.enrollment_id = enrollments.id
            and enrollment_steps.step_id = steps.id
            and enrollments.id = ${body.enrollmentId}::uuid
            and steps.step_number = ${Number(body.stepNumber)}
            and trajectory_staff.trajectory_run_id = enrollments.trajectory_run_id
            and trajectory_staff.user_id = ${userId}::uuid
            and trajectory_staff.active
            and trajectory_staff.role in ('primary_coach', 'trajectory_coach')
          returning enrollment_steps.enrollment_id::text
        `;
        if (!attendance.rows.length) return json(403, { message: 'Je mag de aanwezigheid van deze deelnemer niet wijzigen.' }, origin);
        await connection.queryObject`
          update public.appointment_participants set
            attendance = ${body.present ? 'present' : 'absent'}::public.attendance_status,
            attendance_recorded_by = ${userId}::uuid,
            attendance_recorded_at = now()
          from public.appointments, public.steps
          where appointment_participants.appointment_id = appointments.id
            and appointments.step_id = steps.id
            and appointment_participants.enrollment_id = ${body.enrollmentId}::uuid
            and steps.step_number = ${Number(body.stepNumber)}
        `;
        return json(200, { updated: true }, origin);
      }
      if (body.action !== 'complete_step') return json(400, { message: 'Deze actie is niet geldig.' }, origin);
      const completed = await connection.queryObject<{ enrollment_id: string }>`
        update public.enrollment_steps
        set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now()
        from public.enrollments, public.steps, public.trajectory_runs
        where enrollment_steps.enrollment_id = enrollments.id
          and enrollment_steps.step_id = steps.id
          and trajectory_runs.id = enrollments.trajectory_run_id
          and steps.program_id = trajectory_runs.program_id
          and enrollments.participant_id = ${userId}::uuid
          and steps.step_number = ${Number(body.stepNumber)}
        returning enrollment_steps.enrollment_id::text
      `;
      if (!completed.rows.length) return json(403, { message: 'Deze stap hoort niet bij jouw actieve traject.' }, origin);
      return json(200, { completed: true, stepNumber: body.stepNumber }, origin);
    }

    const globalRolesResult = await connection.queryObject<{ role: string }>`
      select role::text as role
      from public.global_user_roles
      where user_id = ${userId}::uuid and active
    `;
    const staffResult = await connection.queryObject<{ trajectory_run_id: string; role: string }>`
      select trajectory_staff.trajectory_run_id::text, trajectory_staff.role::text as role
      from public.trajectory_staff
      join public.trajectory_runs on trajectory_runs.id = trajectory_staff.trajectory_run_id
      join public.organizations on organizations.id = trajectory_runs.organization_id
      where trajectory_staff.user_id = ${userId}::uuid and trajectory_staff.active
        and (trajectory_staff.role <> 'rsd_user' or organizations.active)
    `;
    const enrollmentResult = await connection.queryObject<{ id: string; trajectory_run_id: string; status: string; exit_category: string | null; exit_advice_summary: string | null; exit_advice_status: string | null }>`
      select id::text, trajectory_run_id::text, status::text as status, exit_category, exit_advice_summary, exit_advice_status
      from public.enrollments
      where participant_id = ${userId}::uuid
    `;

    const enrollment = enrollmentResult.rows[0];
    let participantHome = null;
    let participantDocuments: Array<{ type: string; fileName: string; uploadedAt: string; storagePath: string }> = [];
    if (enrollment) {
      const stepResult = await connection.queryObject<{ trajectory_code: string; trajectory_name: string; trajectory_status: string; step_number: number; title: string; status: string }>`
        select
          trajectory_runs.code as trajectory_code,
          trajectory_runs.name as trajectory_name,
          case when current_date < trajectory_runs.starts_on then 'planned' when current_date > trajectory_runs.ends_on then 'completed' else 'active' end as trajectory_status,
          steps.step_number,
          steps.title,
          enrollment_steps.status::text as status
        from public.enrollments
        join public.trajectory_runs on trajectory_runs.id = enrollments.trajectory_run_id
        join public.steps on steps.program_id = trajectory_runs.program_id and steps.active
        join public.enrollment_steps
          on enrollment_steps.enrollment_id = enrollments.id
          and enrollment_steps.step_id = steps.id
        where enrollments.id = ${enrollment.id}::uuid
        order by steps.step_number
      `;
      const steps = stepResult.rows;
      const firstOpen = steps.find(step => step.status !== 'completed' && step.status !== 'skipped');
      const currentStep = firstOpen?.step_number ?? steps.at(-1)?.step_number ?? 1;
      const participantAppointments=(await connection.queryObject<{id:string;step_number:number|null;title:string;date:string;start_time:string;end_time:string;coach_name:string;location:string|null;explanation:string|null}>`
        select appointments.id::text, steps.step_number, appointments.title,
          to_char(appointments.starts_at at time zone 'Europe/Amsterdam','YYYY-MM-DD') as date,
          to_char(appointments.starts_at at time zone 'Europe/Amsterdam','HH24:MI') as start_time,
          to_char(appointments.ends_at at time zone 'Europe/Amsterdam','HH24:MI') as end_time,
          case when profiles.account_active and exists (
            select 1 from public.trajectory_staff
            where trajectory_staff.trajectory_run_id = appointments.trajectory_run_id
              and trajectory_staff.user_id = appointments.coach_id
              and trajectory_staff.active
              and trajectory_staff.role in ('primary_coach','trajectory_coach')
          ) then trim(profiles.first_name||' '||profiles.last_name)
          else 'Begeleider wordt opnieuw toegewezen' end as coach_name,
          appointments.location, appointments.explanation
        from public.appointment_participants
        join public.appointments on appointments.id=appointment_participants.appointment_id
        left join public.steps on steps.id=appointments.step_id
        left join public.profiles on profiles.id=appointments.coach_id
        where appointment_participants.enrollment_id=${enrollment.id}::uuid
          and appointments.ends_at>=now() and appointments.cancelled_at is null
        order by appointments.starts_at
      `).rows;
      participantHome = {
        personalDetails: {
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          city: profile.city ?? '',
          age: profile.calculated_age == null ? (profile.age_years == null ? '' : String(profile.age_years)) : String(profile.calculated_age),
          phone: profile.phone ?? '',
          email: profile.email,
        },
        trajectoryCode: steps[0]?.trajectory_code ?? '',
        trajectoryName: steps[0]?.trajectory_name ?? '',
        trajectoryStatus: (steps[0]?.trajectory_status as 'active' | 'planned' | 'completed') ?? 'active',
        currentStep,
        currentTitle: firstOpen?.title ?? steps.at(-1)?.title ?? '',
        steps: steps.map(step => ({
          number: step.step_number,
          title: step.title,
          status: step.status === 'completed' || step.status === 'skipped'
            ? 'completed'
            : step.step_number === currentStep
              ? 'current'
              : step.step_number === currentStep + 1
                ? 'available'
                : 'locked',
        })),
        appointments: participantAppointments.map(item=>({id:item.id,stepNumber:item.step_number,title:item.title,date:item.date,startTime:item.start_time,endTime:item.end_time,coachName:item.coach_name,location:item.location,explanation:item.explanation})),
        outcome: enrollment.exit_advice_status && enrollment.exit_category && enrollment.exit_advice_summary ? {
          category: enrollment.exit_category,
          summary: enrollment.exit_advice_summary,
          status: enrollment.exit_advice_status,
        } : undefined,
      };
      const ownDocuments = await connection.queryObject<{ document_type: string; display_name: string; created_at: string; storage_path: string }>`
        select document_type, display_name, to_char(created_at, 'DD-MM-YYYY') as created_at, storage_path
        from public.documents
        where enrollment_id = ${enrollment.id}::uuid and participant_visible and archived_at is null
          and (document_type <> 'talent_report' or (created_at = (select max(newest.created_at) from public.documents newest where newest.enrollment_id = documents.enrollment_id and newest.document_type = 'talent_report' and newest.archived_at is null) and exists (select 1 from public.talent_test_status where talent_test_status.enrollment_id = documents.enrollment_id and talent_test_status.results_released_at is not null)))
        order by created_at desc
      `;
      participantDocuments = ownDocuments.rows.map(document => ({
        type: document.document_type,
        fileName: document.display_name,
        uploadedAt: document.created_at,
        storagePath: document.storage_path,
      }));
    }

    const trajectoryResult = await connection.queryObject<{ id: string; code: string; name: string; commissioner_name: string; start_date: string; end_date: string; status: string }>`
      select distinct
        trajectory_runs.id::text as id,
        trajectory_runs.code,
        trajectory_runs.name,
        organizations.name as commissioner_name,
        to_char(trajectory_runs.starts_on, 'DD-MM-YYYY') as start_date,
        to_char(trajectory_runs.ends_on, 'DD-MM-YYYY') as end_date,
        trajectory_runs.starts_on as sort_date,
        case
          when current_date < trajectory_runs.starts_on then 'planned'
          when current_date > trajectory_runs.ends_on then 'completed'
          else 'active'
        end as status
      from public.trajectory_runs
      join public.organizations on organizations.id = trajectory_runs.organization_id
      left join public.trajectory_staff
        on trajectory_staff.trajectory_run_id = trajectory_runs.id
        and trajectory_staff.user_id = ${userId}::uuid
        and trajectory_staff.active
      where (trajectory_staff.user_id is not null and (trajectory_staff.role <> 'rsd_user' or organizations.active))
        or exists (
          select 1 from public.global_user_roles
          where global_user_roles.user_id = ${userId}::uuid
            and global_user_roles.role = 'functional_admin'
            and global_user_roles.active
        )
      order by sort_date
    `;
    const dashboardTrajectories = [];
    const answerLabels: Record<string, string> = {
      name: 'Voor- en achternaam', city: 'Woonplaats', age: 'Leeftijd', phone: 'Telefoonnummer', email: 'E-mailadres',
      description: 'Hoe zou je jezelf omschrijven?', strengths: 'Waar ben je goed in?', energy: 'Waar krijg je energie van?',
      school: 'School of opleider', education: 'Opleiding of richting', educationStatus: 'Status opleiding',
      organization: 'Bedrijf of organisatie', experienceType: 'Functie of soort ervaring', experienceDescription: 'Wat deed je daar?',
      drivingLicense: 'Rijbewijs', languages: 'Talen', certificates: 'Certificaten',
    };
    for (const trajectory of trajectoryResult.rows) {
      const canSeeAllParticipants = globalRolesResult.rows.some(item => item.role === 'functional_admin') || staffResult.rows.some(item => item.trajectory_run_id === trajectory.id && item.role === 'rsd_user');
      const coaches = await connection.queryObject<{ id: string; name: string }>`
        select profiles.id::text as id, trim(profiles.first_name || ' ' || profiles.last_name) as name
        from public.trajectory_staff
        join public.profiles on profiles.id = trajectory_staff.user_id
        join public.trajectory_runs on trajectory_runs.id = trajectory_staff.trajectory_run_id
        where trajectory_runs.code = ${trajectory.code}
          and trajectory_staff.active
          and profiles.account_active
          and trajectory_staff.role in ('primary_coach', 'trajectory_coach')
      `;
      const participants = await connection.queryObject<{ enrollment_id: string; name: string; email: string; phone: string | null; city: string | null; birth_date: string | null; active: boolean; activated_at: string | null; coach_id: string | null; goals: string; exit_category: string | null; exit_advice_summary: string | null; exit_advice_status: string | null; step_number: number; step_status: string; attendance: string; talent_completed_at: string | null; talent_released_at: string | null }>`
        select
          enrollments.id::text as enrollment_id,
          trim(profiles.first_name || ' ' || profiles.last_name) as name,
          profiles.email,
          profiles.phone,
          profiles.city,
          to_char(profiles.date_of_birth, 'YYYY-MM-DD') as birth_date,
          profiles.account_active as active,
          to_char(enrollments.activated_at AT TIME ZONE 'Europe/Amsterdam', 'DD-MM-YYYY') as activated_at,
          enrollments.primary_coach_id::text as coach_id,
          enrollments.goals_result::text as goals,
          enrollments.exit_category,
          enrollments.exit_advice_summary,
          enrollments.exit_advice_status,
          steps.step_number,
          enrollment_steps.status::text as step_status,
          enrollment_steps.attendance::text as attendance
          ,talent_test_status.completed_at::text as talent_completed_at
          ,talent_test_status.results_released_at::text as talent_released_at
        from public.enrollments
        join public.profiles on profiles.id = enrollments.participant_id
        join public.trajectory_runs on trajectory_runs.id = enrollments.trajectory_run_id
        join public.enrollment_steps on enrollment_steps.enrollment_id = enrollments.id
        join public.steps on steps.id = enrollment_steps.step_id
        left join public.talent_test_status on talent_test_status.enrollment_id = enrollments.id
        where trajectory_runs.code = ${trajectory.code}
          and (${canSeeAllParticipants} or enrollments.primary_coach_id = ${userId}::uuid)
        order by name, steps.step_number
      `;
      const grouped = new Map<string, typeof participants.rows>();
      for (const row of participants.rows) grouped.set(row.enrollment_id, [...(grouped.get(row.enrollment_id) ?? []), row]);
      const mayReadAnswers = staffResult.rows.some(item => item.trajectory_run_id === trajectory.id && ['primary_coach', 'trajectory_coach'].includes(item.role));
      const documentsByEnrollment = new Map<string, Array<{ enrollment_id: string; document_type: string; display_name: string; created_at: string; storage_path: string }>>();
      if (mayReadAnswers) {
        const documentResult = await connection.queryObject<{ enrollment_id: string; document_type: string; display_name: string; created_at: string; storage_path: string }>`
          select documents.enrollment_id::text, documents.document_type, documents.display_name,
            to_char(documents.created_at, 'DD-MM-YYYY') as created_at, documents.storage_path
          from public.documents
          join public.enrollments on enrollments.id = documents.enrollment_id
          where enrollments.trajectory_run_id = ${trajectory.id}::uuid and documents.archived_at is null
            and documents.document_type in ('cv', 'talent_report')
          order by documents.created_at desc
        `;
        for (const document of documentResult.rows) documentsByEnrollment.set(document.enrollment_id, [...(documentsByEnrollment.get(document.enrollment_id) ?? []), document]);
      }
      const answerGroups = new Map<string, Map<string, { step: number; title: string; answers: Array<{ question: string; answer: string }> }>>();
      if (mayReadAnswers) {
        const answers = await connection.queryObject<{ enrollment_id: string; step_number: number; step_title: string; content_key: string; question: string; answer_text: string | null; answer_data: unknown }>`
          select answers.enrollment_id::text, steps.step_number, steps.title as step_title,
            step_content.content_key, step_content.title as question, answers.answer_text, answers.answer_data
          from public.answers
          join public.step_content on step_content.id = answers.content_id
          join public.steps on steps.id = step_content.step_id
          join public.enrollments on enrollments.id = answers.enrollment_id
          where enrollments.trajectory_run_id = ${trajectory.id}::uuid
            and not answers.skipped
            and step_content.answer_visibility in ('participant_and_coaches', 'participant_coaches_and_project_leader')
          order by answers.enrollment_id, steps.step_number, step_content.sort_order
        `;
        for (const row of answers.rows) {
          const enrollmentGroups = answerGroups.get(row.enrollment_id) ?? new Map();
          answerGroups.set(row.enrollment_id, enrollmentGroups);
          const groupKey = `${row.step_number}:${row.step_title}`;
          const group = enrollmentGroups.get(groupKey) ?? { step: row.step_number, title: row.step_title, answers: [] };
          enrollmentGroups.set(groupKey, group);
          if (row.answer_text) group.answers.push({ question: row.question, answer: row.answer_text });
          else if (Array.isArray(row.answer_data)) group.answers.push({ question: row.question, answer: row.answer_data.join(', ') });
          else if (row.answer_data && typeof row.answer_data === 'object') {
            for (const [key, value] of Object.entries(row.answer_data as Record<string, unknown>)) {
              const text = String(value ?? '').trim();
              if (text) group.answers.push({ question: answerLabels[key.replace(/\d+$/, '')] ?? key, answer: text });
            }
          }
        }
      }
      const measurementsByEnrollment = new Map<string, { start?: number[]; end?: number[] }>();
      const measurementAnswers = await connection.queryObject<{ enrollment_id: string; content_key: string; answer_data: unknown }>`
        select answers.enrollment_id::text, step_content.content_key, answers.answer_data
        from public.answers
        join public.step_content on step_content.id = answers.content_id
        join public.enrollments on enrollments.id = answers.enrollment_id
        where enrollments.trajectory_run_id = ${trajectory.id}::uuid
          and step_content.content_key in ('s1-measurement', 's7-measurement')
          and step_content.answer_visibility = 'participant_coaches_and_project_leader'
          and not answers.skipped
      `;
      const measurementSubjects = [
        'Vertrouwen in de ondersteuning en dienstverlening',
        'Vertrouwen in jezelf',
        'Motivatie',
        'Inzicht in jouw toekomst',
        'Werknemersvaardigheden',
      ];
      for (const row of measurementAnswers.rows) {
        if (!row.answer_data || typeof row.answer_data !== 'object' || Array.isArray(row.answer_data)) continue;
        const values = measurementSubjects.map(subject => Number((row.answer_data as Record<string, unknown>)[subject]));
        if (values.some(value => !Number.isInteger(value) || value < 1 || value > 10)) continue;
        const measurements = measurementsByEnrollment.get(row.enrollment_id) ?? {};
        if (row.content_key === 's1-measurement') measurements.start = values;
        if (row.content_key === 's7-measurement') measurements.end = values;
        measurementsByEnrollment.set(row.enrollment_id, measurements);
      }
      dashboardTrajectories.push({
        code: trajectory.code,
        name: trajectory.name,
        commissionerName: trajectory.commissioner_name,
        startDate: trajectory.start_date,
        endDate: trajectory.end_date,
        status: trajectory.status,
        coaches: coaches.rows,
        participants: [...grouped.values()].map(rows => {
          const first = rows[0];
          const measurements = measurementsByEnrollment.get(first.enrollment_id);
          const appSteps = Array.from({ length: 7 }, (_, index) => ['completed', 'skipped'].includes(rows.find(row => row.step_number === index + 1)?.step_status ?? ''));
          const attendance = Array.from({ length: 7 }, (_, index) => {
            if (index === 2 || index === 4) return null;
            return rows.find(row => row.step_number === index + 1)?.attendance === 'present';
          });
          return {
            id: first.enrollment_id,
            active: first.active,
            activatedAt: first.activated_at ?? undefined,
            name: first.name,
            email: first.email,
            phone: first.phone ?? undefined,
            city: first.city ?? undefined,
            birthDate: first.birth_date ?? undefined,
            coachId: first.coach_id ?? undefined,
            appSteps,
            attendance,
            needsAttention: false,
            completed: appSteps.every(Boolean),
            goals: ({ yes: 'Ja', partial: 'Deels', no: 'Nee', not_assessed: 'Nog niet bekend' } as Record<string, string>)[first.goals] ?? 'Nog niet bekend',
            outcomeCategory: first.exit_category ?? undefined,
            outcomeSummary: first.exit_advice_summary ?? undefined,
            outcomeStatus: first.exit_advice_status === 'final' ? 'final' : first.exit_advice_status === 'provisional' ? 'provisional' : undefined,
            startScores: measurements?.start,
            endScores: measurements?.end,
            appAnswers: [...(answerGroups.get(first.enrollment_id)?.values() ?? [])],
            documents: (documentsByEnrollment.get(first.enrollment_id) ?? []).map(document => ({
              type: document.document_type,
              fileName: document.display_name,
              uploadedAt: document.created_at,
              storagePath: document.storage_path,
            })),
            talentStatus: first.talent_released_at ? 'released' : first.talent_completed_at ? 'completed' : 'not_started',
          };
        }),
      });
    }

    const requestedAppointments=new URL(request.url).searchParams.get('appointments');
    const dashboardAppointments=requestedAppointments?(await connection.queryObject<{id:string;trajectory_code:string;step_number:number;title:string;date:string;start_time:string;end_time:string;location:string|null;explanation:string|null;coach_id:string;coach_name:string;participant_id:string|null;participant_name:string|null;cancelled:boolean}>`select appointments.id::text,trajectory_runs.code as trajectory_code,steps.step_number,appointments.title,to_char(appointments.starts_at at time zone 'Europe/Amsterdam','YYYY-MM-DD') as date,to_char(appointments.starts_at at time zone 'Europe/Amsterdam','HH24:MI') as start_time,to_char(appointments.ends_at at time zone 'Europe/Amsterdam','HH24:MI') as end_time,appointments.location,appointments.explanation,appointments.coach_id::text,trim(profiles.first_name||' '||profiles.last_name) as coach_name,(select case when appointments.kind='individual' then ap.enrollment_id::text end from public.appointment_participants ap where ap.appointment_id=appointments.id limit 1) as participant_id,(select case when appointments.kind='individual' then trim(pp.first_name||' '||pp.last_name) end from public.appointment_participants ap join public.enrollments ee on ee.id=ap.enrollment_id join public.profiles pp on pp.id=ee.participant_id where ap.appointment_id=appointments.id limit 1) as participant_name,(appointments.cancelled_at is not null) as cancelled from public.appointments join public.trajectory_runs on trajectory_runs.id=appointments.trajectory_run_id join public.steps on steps.id=appointments.step_id left join public.profiles on profiles.id=appointments.coach_id where trajectory_runs.code=${requestedAppointments} and (exists(select 1 from public.global_user_roles where user_id=${userId}::uuid and role='functional_admin' and active) or exists(select 1 from public.trajectory_staff where trajectory_run_id=trajectory_runs.id and user_id=${userId}::uuid and active and role in ('primary_coach','trajectory_coach'))) order by appointments.starts_at`).rows.map(item=>({id:item.id,trajectoryCode:item.trajectory_code,stepNumber:item.step_number,title:item.title,date:item.date,startTime:item.start_time,endTime:item.end_time,location:item.location??'',explanation:item.explanation??'',coachId:item.coach_id,coachName:item.coach_name,participantId:item.participant_id??undefined,participantName:item.participant_name??undefined,cancelled:item.cancelled})):[];

    const mayManage = globalRolesResult.rows.some(item => item.role === 'functional_admin');
    if (requestedAppointments && !mayManage) {
      const ownAppointments = dashboardAppointments.filter(item => item.coachId === userId);
      dashboardAppointments.splice(0, dashboardAppointments.length, ...ownAppointments);
    }
    const managedUserRows = mayManage ? (await connection.queryObject<{id:string;name:string;email:string;active:boolean;global_role:string|null;staff_role:string|null;trajectory_code:string|null;organization:string|null;commissioner_code:string|null}>`
      select profiles.id::text,trim(profiles.first_name||' '||profiles.last_name) as name,profiles.email,profiles.account_active as active,global_user_roles.role::text as global_role,trajectory_staff.role::text as staff_role,trajectory_runs.code as trajectory_code,coalesce(profiles.organization_name,organizations.name) as organization,organizations.code as commissioner_code
      from public.profiles left join public.global_user_roles on global_user_roles.user_id=profiles.id and (global_user_roles.active or global_user_roles.revoked_at is null) left join public.trajectory_staff on trajectory_staff.user_id=profiles.id and (trajectory_staff.active or trajectory_staff.revoked_at is null) left join public.trajectory_runs on trajectory_runs.id=trajectory_staff.trajectory_run_id left join public.organizations on organizations.id=trajectory_runs.organization_id
      where global_user_roles.role='functional_admin' or trajectory_staff.role in ('primary_coach','trajectory_coach','rsd_user') order by name
    `).rows : [];
    const managedUsersMap=new Map<string,{id:string;name:string;email:string;role:'project_leader'|'coach'|'commissioner';organization:string;commissionerCode?:string;trajectoryCodes:string[];active:boolean}>();
    for(const row of managedUserRows){const role=row.global_role==='functional_admin'?'project_leader':row.staff_role==='rsd_user'?'commissioner':'coach';const current=managedUsersMap.get(row.id)??{id:row.id,name:row.name,email:row.email,role,organization:row.organization??(role==='commissioner'?'Opdrachtgever':'Munks BV'),commissionerCode:role==='commissioner'?(row.commissioner_code??undefined):undefined,trajectoryCodes:[],active:row.active};if(row.trajectory_code&&!current.trajectoryCodes.includes(row.trajectory_code))current.trajectoryCodes.push(row.trajectory_code);managedUsersMap.set(row.id,current)}
    const dashboardManagementOptions = mayManage ? {
      coaches: (await connection.queryObject<{ id: string; name: string }>`
        select distinct profiles.id::text as id, trim(profiles.first_name || ' ' || profiles.last_name) as name
        from public.profiles
        join public.trajectory_staff on trajectory_staff.user_id = profiles.id and trajectory_staff.active
        where profiles.account_active and trajectory_staff.role in ('primary_coach', 'trajectory_coach')
        order by name
      `).rows,
      commissioners: (await connection.queryObject<{ code: string; name: string }>`select code, name from public.organizations where active order by name`).rows,
      organizations: (await connection.queryObject<{ code:string;name:string;active:boolean }>`select code,name,active from public.organizations order by name`).rows,
      users: [...managedUsersMap.values()],
      security: { mfaRequired },
    } : undefined;

    return json(200, {
      user: {
        id: userId,
        displayName: `${profile.first_name} ${profile.last_name}`.trim(),
      },
      globalRoles: globalRolesResult.rows.map(item => item.role),
      trajectoryRoles: staffResult.rows,
      enrollments: enrollmentResult.rows,
      participantHome,
      participantDocuments,
      dashboardTrajectories,
      dashboardAppointments,
      dashboardManagementOptions,
      security: { mfaRequired },
    }, origin);
  } catch (error) {
    console.error('session database lookup failed', error);
    return json(500, { message: 'De sessiegegevens konden niet veilig worden opgehaald.' }, origin);
  } finally {
    connection.release();
  }
});
