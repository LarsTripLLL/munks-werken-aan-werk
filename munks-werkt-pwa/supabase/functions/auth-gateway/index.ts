import { Pool } from 'jsr:@db/postgres@^0';

const supabaseUrl=Deno.env.get('SUPABASE_URL')??'';
const publishableKey=Deno.env.get('SUPABASE_ANON_KEY')??'';
const pool=new Pool(Deno.env.get('SUPABASE_DB_URL')??'',1);
const allowedOrigins=new Set((Deno.env.get('ALLOWED_ORIGINS')??'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4175,http://127.0.0.1:4175').split(',').map(value=>value.trim()).filter(Boolean));
const cors=(origin:string|null)=>({'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Origin',...(origin&&allowedOrigins.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})});
const json=(status:number,body:unknown,origin:string|null)=>new Response(JSON.stringify(body),{status,headers:cors(origin)});
const emailPattern=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const delay=(milliseconds:number)=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');

Deno.serve(async request=>{
  const started=Date.now();
  const origin=request.headers.get('Origin');
  if(origin&&!allowedOrigins.has(origin))return json(403,{message:'Deze herkomst is niet toegestaan.'},origin);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
  if(request.method!=='POST')return json(405,{message:'Deze methode is niet toegestaan.'},origin);
  const body=await request.json().catch(()=>({})) as {action?:string;email?:string;password?:string;redirectTo?:string};
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  const action=body.action;
  if(!['sign_in','request_reset'].includes(action??'')||!emailPattern.test(email)){
    await delay(Math.max(0,2500-Date.now()+started));
    return json(400,{message:'De aanvraag is niet geldig.'},origin);
  }
  const forwarded=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('cf-connecting-ip')||'unknown';
  const key=await hash(`${action}|${email}|${forwarded}`);
  const connection=await pool.connect();
  try{
    const counter=await connection.queryObject<{attempts:number}>`
      insert into public.auth_gateway_limits(key_hash,action,window_started_at,attempts)
      values(${key},${action},now(),1)
      on conflict(key_hash) do update set
        attempts=case when auth_gateway_limits.window_started_at<now()-interval '10 minutes' then 1 else auth_gateway_limits.attempts+1 end,
        window_started_at=case when auth_gateway_limits.window_started_at<now()-interval '10 minutes' then now() else auth_gateway_limits.window_started_at end
      returning attempts
    `;
    if((counter.rows[0]?.attempts??1)>10){
      await delay(Math.max(0,2500-Date.now()+started));
      return json(429,{message:'Er zijn tijdelijk te veel aanvragen gedaan. Probeer het later opnieuw.'},origin);
    }
  }finally{connection.release()}

  let response:Response;
  if(action==='sign_in'){
    response=await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email,password:body.password??''})});
    const result=await response.json().catch(()=>({}));
    await delay(Math.max(0,2500-Date.now()+started));
    return response.ok?json(200,result,origin):json(400,{message:'Het e-mailadres of wachtwoord is niet juist.'},origin);
  }

  let redirectTo='';
  try{const candidate=new URL(body.redirectTo??'');if(allowedOrigins.has(candidate.origin))redirectTo=candidate.toString()}catch{/* generieke afhandeling */}
  if(redirectTo)await fetch(`${supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email})}).catch(()=>undefined);
  await delay(Math.max(0,2500-Date.now()+started));
  return json(202,{accepted:true},origin);
});
