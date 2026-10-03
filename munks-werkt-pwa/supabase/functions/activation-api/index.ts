import { createClient } from 'npm:@supabase/supabase-js@2';
import { Pool } from 'jsr:@db/postgres@^0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const pool = new Pool(Deno.env.get('SUPABASE_DB_URL') ?? '', 1);
const allowedOrigins = new Set((Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4175,http://127.0.0.1:4175').split(',').map(value => value.trim()).filter(Boolean));
const headers = (origin: string | null) => ({'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Origin',...(origin&&allowedOrigins.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})});
const json = (status:number,body:unknown,origin:string|null)=>new Response(JSON.stringify(body),{status,headers:headers(origin)});
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async request => {
  const origin=request.headers.get('Origin');
  if(origin&&!allowedOrigins.has(origin))return json(403,{message:'Deze herkomst is niet toegestaan.'},origin);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:headers(origin)});
  if(request.method!=='POST')return json(405,{message:'Deze methode is niet toegestaan.'},origin);
  const body=await request.json().catch(()=>({})) as {action?:string;email?:string;code?:string;sessionId?:string;password?:string;consent?:{privacyVersion?:string;consentVersion?:string;privacyAccepted?:boolean;consentAccepted?:boolean;aiAssistantEnabled?:boolean}};
  const connection=await pool.connect();
  try {
    if(body.action==='begin_activation'){
      if(typeof body.email!=='string'||!emailPattern.test(body.email.trim())||typeof body.code!=='string'||!/^\d{6,8}$/.test(body.code))return json(400,{message:'Controleer je e-mailadres en activatiecode.'},origin);
      const invite=await connection.queryObject<{id:string;matches:boolean;attempts:number}>`
        with candidate as (
          select id, crypt(${body.code},code_hash)=code_hash as matches
          from public.activation_invites
          where lower(email)=lower(${body.email.trim()})
            and used_at is null
            and expires_at>now()
            and attempts<5
          order by created_at desc
          limit 1
          for update
        )
        update public.activation_invites invite
        set attempts=invite.attempts+case when candidate.matches then 0 else 1 end
        from candidate
        where invite.id=candidate.id
        returning invite.id::text,candidate.matches,invite.attempts
      `;
      if(!invite.rows.length||!invite.rows[0].matches)return json(403,{message:'De activatiecode is niet geldig, verlopen of te vaak geprobeerd.'},origin);
      const token=`${crypto.randomUUID()}${crypto.randomUUID()}`;
      await connection.queryObject`update public.activation_invites set session_token_hash=crypt(${token},gen_salt('bf')),session_expires_at=now()+interval '20 minutes' where id=${invite.rows[0].id}::uuid`;
      return json(200,{activationSessionId:`${invite.rows[0].id}.${token}`},origin);
    }
    if(body.action==='complete_activation'){
      if(!body.sessionId||!body.password||body.password.length<12||body.password.length>128||!body.consent?.privacyAccepted||!body.consent?.consentAccepted)return json(400,{message:'De activatiegegevens, het wachtwoord of de toestemmingen zijn niet geldig.'},origin);
      const [inviteId,token]=body.sessionId.split('.',2);if(!inviteId||!token)return json(403,{message:'De activatiesessie is ongeldig.'},origin);
      const invite=await connection.queryObject<{enrollment_id:string;participant_id:string}>`
        with claimed as (
          update public.activation_invites
          set used_at=now(),session_token_hash=null,session_expires_at=null
          where id=${inviteId}::uuid
            and used_at is null
            and session_expires_at>now()
            and crypt(${token},session_token_hash)=session_token_hash
          returning enrollment_id
        )
        select claimed.enrollment_id::text,enrollments.participant_id::text
        from claimed
        join public.enrollments on enrollments.id=claimed.enrollment_id
      `;
      if(!invite.rows.length)return json(403,{message:'De activatiesessie is verlopen. Begin opnieuw.'},origin);
      const admin=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
      const updated=await admin.auth.admin.updateUserById(invite.rows[0].participant_id,{password:body.password});
      if(updated.error)return json(500,{message:'Het wachtwoord kon niet veilig worden ingesteld.'},origin);
      await connection.queryObject`insert into public.consents(user_id,enrollment_id,document_type,document_version,accepted) values(${invite.rows[0].participant_id}::uuid,${invite.rows[0].enrollment_id}::uuid,'privacy_notice',${body.consent.privacyVersion??'concept-2026-08'},true),(${invite.rows[0].participant_id}::uuid,${invite.rows[0].enrollment_id}::uuid,'consent_form',${body.consent.consentVersion??'concept-2026-08'},true) on conflict(user_id,enrollment_id,document_type,document_version) do update set accepted=true,withdrawn_at=null,recorded_at=now()`;
      await connection.queryObject`insert into public.ai_preferences(user_id,enabled,updated_at) values(${invite.rows[0].participant_id}::uuid,${!!body.consent.aiAssistantEnabled},now()) on conflict(user_id) do update set enabled=excluded.enabled,updated_at=now()`;
      await connection.queryObject`update public.enrollments set status='active',activated_at=now(),updated_at=now() where id=${invite.rows[0].enrollment_id}::uuid`;
      const unbanned=await admin.auth.admin.updateUserById(invite.rows[0].participant_id,{ban_duration:'none'});
      if(unbanned.error)return json(500,{message:'De activatie is opgeslagen, maar het account kon niet worden vrijgegeven. Neem contact op met de beheerder.'},origin);
      await connection.queryObject`insert into public.audit_log(actor_user_id,enrollment_id,action,data_category,target_table,target_id,metadata) values(${invite.rows[0].participant_id}::uuid,${invite.rows[0].enrollment_id}::uuid,'account_activated','consent','activation_invites',${inviteId},${JSON.stringify({aiAssistantEnabled:!!body.consent.aiAssistantEnabled})}::jsonb)`;
      return json(200,{activated:true},origin);
    }
    return json(400,{message:'Deze activatieactie is niet geldig.'},origin);
  }catch(error){console.error('activation failed',error);return json(500,{message:'De accountactivatie kon niet veilig worden afgerond.'},origin)}finally{connection.release()}
});
