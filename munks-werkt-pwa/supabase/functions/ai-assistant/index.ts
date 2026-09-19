import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js';

const supabaseUrl=Deno.env.get('SUPABASE_URL')??'',publishableKey=Deno.env.get('SUPABASE_ANON_KEY')??'',databaseUrl=Deno.env.get('SUPABASE_DB_URL')??Deno.env.get('DATABASE_URL')??'',openAiKey=Deno.env.get('OPENAI_API_KEY')??'',model=Deno.env.get('OPENAI_MODEL')??'gpt-5-mini';
const configuredGlobalLimit=Number(Deno.env.get('AI_DAILY_GLOBAL_LIMIT')??'500');
const globalDailyLimit=Number.isInteger(configuredGlobalLimit)&&configuredGlobalLimit>0?configuredGlobalLimit:500;
const allowedOrigins=new Set((Deno.env.get('ALLOWED_ORIGINS')??'http://localhost:5173,http://127.0.0.1:5173').split(',').map(v=>v.trim()).filter(Boolean));
const sql=postgres(databaseUrl,{prepare:false});
const cors=(origin:string)=>({'Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'});
const json=(status:number,data:unknown,origin:string)=>new Response(JSON.stringify(data),{status,headers:{...cors(origin),'Content-Type':'application/json','Cache-Control':'private, no-store'}});

Deno.serve(async request=>{
 const origin=request.headers.get('origin')??'';
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(request.method!=='POST'||!allowedOrigins.has(origin))return json(403,{message:'Deze aanvraag is niet toegestaan.'},origin);
 try{
  const token=(request.headers.get('authorization')??'').replace(/^Bearer\s+/i,'');
  const auth=createClient(supabaseUrl,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await auth.auth.getUser(token);if(error||!data.user)return json(401,{message:'Meld je opnieuw aan.'},origin);
  const userId=data.user.id,body=await request.json().catch(()=>({})) as {action?:string;message?:string};
  await sql`delete from public.ai_messages where created_at<now()-interval '90 days'`;
  await sql`delete from public.ai_conversations where updated_at<now()-interval '90 days' and not exists(select 1 from public.ai_messages where ai_messages.conversation_id=ai_conversations.id)`;
  await sql`delete from public.ai_daily_usage where usage_date<current_date-interval '2 days'`;
  const access=await sql<{enrollment_id:string;enabled:boolean;active:boolean}[]>`select enrollments.id::text as enrollment_id,coalesce(ai_preferences.enabled,false) as enabled,profiles.account_active as active from public.enrollments join public.profiles on profiles.id=enrollments.participant_id left join public.ai_preferences on ai_preferences.user_id=profiles.id where enrollments.participant_id=${userId}::uuid and enrollments.status='active' order by enrollments.created_at desc limit 1`;
  if(!access.length||!access[0].active)return json(403,{message:'Je deelnemersaccount is niet actief.'},origin);
  if(body.action==='status')return json(200,{enabled:access[0].enabled},origin);
  if(body.action==='set_preference'){
   const enabled=body.message==='true';
   await sql.begin(async tx=>{await tx`insert into public.ai_preferences(user_id,enabled,updated_at) values(${userId}::uuid,${enabled},now()) on conflict(user_id) do update set enabled=excluded.enabled,updated_at=now()`;await tx`insert into public.audit_log(actor_user_id,enrollment_id,action,data_category,target_table,target_id,metadata) values(${userId}::uuid,${access[0].enrollment_id}::uuid,'ai_preference_updated','consent','ai_preferences',${userId},${JSON.stringify({enabled})}::jsonb)`;});
   return json(200,{enabled},origin);
  }
  if(!access[0].enabled)return json(403,{message:'Je hebt geen toestemming gegeven voor de AI-assistent.'},origin);
  let conversations=await sql<{id:string}[]>`select id::text from public.ai_conversations where user_id=${userId}::uuid and enrollment_id=${access[0].enrollment_id}::uuid order by updated_at desc limit 1`;
  if(!conversations.length)conversations=await sql<{id:string}[]>`insert into public.ai_conversations(user_id,enrollment_id) values(${userId}::uuid,${access[0].enrollment_id}::uuid) on conflict(user_id,enrollment_id) do update set updated_at=public.ai_conversations.updated_at returning id::text`;
  const conversationId=conversations[0].id;
  if(body.action==='list'){const messages=await sql`select id::text,sender,body,created_at::text as "sentAt" from public.ai_messages where conversation_id=${conversationId}::uuid order by created_at asc limit 100`;return json(200,{messages},origin)}
  const message=typeof body.message==='string'?body.message.trim():'';if(body.action!=='send'||!message)return json(400,{message:'Schrijf eerst een vraag.'},origin);if(message.length>1500)return json(400,{message:'Je vraag mag maximaal 1500 tekens bevatten.'},origin);
  if(/\b(bsn|burgerservicenummer|wachtwoord|paspoortnummer|identiteitsbewijs)\b/i.test(message))return json(400,{message:'Deel hier geen BSN, wachtwoord of gegevens van een identiteitsbewijs. Verwijder die gegevens en stel je vraag opnieuw.'},origin);
  if(!openAiKey)return json(503,{message:'De AI-assistent is nog niet gekoppeld. Probeer het later opnieuw.'},origin);
  const reservation=await sql.begin(async tx=>{
   const userSlot=await tx`insert into public.ai_daily_usage(scope,owner,usage_date,used) values('user',${userId},current_date,1) on conflict(scope,owner,usage_date) do update set used=ai_daily_usage.used+1 where ai_daily_usage.used<20 returning used`;
   if(!userSlot.length)return 'user';
   const globalSlot=await tx`insert into public.ai_daily_usage(scope,owner,usage_date,used) values('global','*',current_date,1) on conflict(scope,owner,usage_date) do update set used=ai_daily_usage.used+1 where ai_daily_usage.used<${globalDailyLimit} returning used`;
   if(!globalSlot.length)throw new Error('AI_GLOBAL_LIMIT');
   return 'ok';
  }).catch(error=>{if(error instanceof Error&&error.message==='AI_GLOBAL_LIMIT')return 'global';throw error});
  if(reservation==='user')return json(429,{message:'Je hebt vandaag de limiet van 20 aanvragen bereikt. Morgen kun je de AI-assistent weer gebruiken.'},origin);
  if(reservation==='global')return json(429,{message:'De AI-assistent heeft de daglimiet bereikt. Probeer het morgen opnieuw.'},origin);
  const moderationResponse=await fetch('https://api.openai.com/v1/moderations',{method:'POST',headers:{Authorization:`Bearer ${openAiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'omni-moderation-latest',input:message})});
  const moderation=await moderationResponse.json().catch(()=>null) as {results?:Array<{flagged?:boolean}>}|null;
  const inputFlagged=moderation?.results?.[0]?.flagged;
  if(!moderationResponse.ok||typeof inputFlagged!=='boolean')return json(502,{message:'De veiligheidscontrole is tijdelijk niet beschikbaar. Probeer het later opnieuw.'},origin);
  if(inputFlagged)return json(400,{message:'Met deze vraag kan de AI-assistent niet helpen. Neem bij zorgen of gevaar contact op met je begeleider; bel bij direct gevaar 112.'},origin);
  const history=await sql<{sender:string;body:string}[]>`select sender,body from public.ai_messages where conversation_id=${conversationId}::uuid order by created_at desc limit 10`;
  const input=[...history.reverse().map(item=>({role:item.sender==='assistant'?'assistant':'user',content:item.body})),{role:'user',content:message}];
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${openAiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,store:false,max_output_tokens:900,instructions:'Je bent de AI-assistent van Munks Werkt. Antwoord in eenvoudig, vriendelijk Nederlands (B1), kort en praktisch, bij voorkeur in maximaal 350 woorden. Rond elk antwoord volledig af. Help uitsluitend met werk, opleidingen, sollicitaties, cv, werknemersvaardigheden en voorbereiding op trajectgesprekken. Neem geen beslissingen over deelnemers, stel geen diagnoses en geef geen juridisch, medisch of financieel advies. Vraag nooit om BSN, wachtwoorden, identiteitsdocumenten of bijzondere persoonsgegevens. Bij direct gevaar verwijs je naar 112; bij persoonlijke problemen naar een begeleider. Zeg bij onderwerpen buiten deze afbakening vriendelijk dat je alleen met het Munks Werkt-traject helpt.',input})});
  const result=await response.json().catch(()=>null) as {status?:string;output?:Array<{content?:Array<{type?:string;text?:string}>}>;usage?:{input_tokens?:number;output_tokens?:number}}|null;
  if(!response.ok||!result)return json(502,{message:'De AI-assistent kon nu geen antwoord geven. Probeer het later opnieuw.'},origin);
  if(result.status!=='completed')return json(502,{message:'Het antwoord werd niet volledig afgerond. Probeer een kortere vraag.'},origin);
  const answer=result.output?.flatMap(item=>item.content??[]).filter(item=>item.type==='output_text').map(item=>item.text??'').join('\n').trim();if(!answer)return json(502,{message:'De AI-assistent gaf geen bruikbaar antwoord.'},origin);
  if(answer.length>8000)return json(502,{message:'Het antwoord is te lang. Probeer een kortere vraag.'},origin);
  const outputModerationResponse=await fetch('https://api.openai.com/v1/moderations',{method:'POST',headers:{Authorization:`Bearer ${openAiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'omni-moderation-latest',input:answer})});
  const outputModeration=await outputModerationResponse.json().catch(()=>null) as {results?:Array<{flagged?:boolean}>}|null;
  const outputFlagged=outputModeration?.results?.[0]?.flagged;
  if(!outputModerationResponse.ok||typeof outputFlagged!=='boolean'||outputFlagged)return json(502,{message:'Het antwoord kon niet veilig worden getoond. Bespreek je vraag met je begeleider.'},origin);
  const saved=await sql.begin(async tx=>{
   const current=await tx<{enabled:boolean}[]>`select ai_preferences.enabled from public.ai_preferences join public.profiles on profiles.id=ai_preferences.user_id join public.enrollments on enrollments.participant_id=profiles.id where ai_preferences.user_id=${userId}::uuid and enrollments.id=${access[0].enrollment_id}::uuid and enrollments.status='active' and profiles.account_active for update of ai_preferences,profiles,enrollments`;
   if(!current[0]?.enabled)return false;
   await tx`insert into public.ai_messages(conversation_id,sender,body) values(${conversationId}::uuid,'participant',${message})`;
   await tx`insert into public.ai_messages(conversation_id,sender,body,input_tokens,output_tokens) values(${conversationId}::uuid,'assistant',${answer},${result.usage?.input_tokens??null},${result.usage?.output_tokens??null})`;
   await tx`update public.ai_conversations set updated_at=now() where id=${conversationId}::uuid`;
   return true;
  });
  if(!saved)return json(403,{message:'De AI-assistent is inmiddels uitgeschakeld of je account is niet actief.'},origin);
  return json(200,{answer},origin);
 }catch(error){console.error(error);return json(500,{message:'Er ging iets mis bij de AI-assistent. Probeer het later opnieuw.'},origin)}
});
