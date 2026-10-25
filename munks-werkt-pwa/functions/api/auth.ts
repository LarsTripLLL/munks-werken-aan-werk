type PagesContext = {
  request: Request;
  env: { SUPABASE_URL?: string; SUPABASE_PUBLISHABLE_KEY?: string };
};
type TokenResult = {
  access_token?: string;
  refresh_token?: string;
  user?: { id: string; email?: string };
  message?: string;
  code?: string;
};

const defaultSupabaseUrl = 'https://orjhgublycqppndygpxg.supabase.co';
const defaultPublishableKey = 'sb_publishable_m7ievpfhIScZ-PJOR8QP0g_QDt5eNJ8';
const cookieName = '__Host-munks-refresh';
const baseHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};
const sessionCookie = (token: string) => `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
const clearCookie = `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
const reply = (status: number, body: unknown, cookie?: string) => new Response(JSON.stringify(body), { status, headers: { ...baseHeaders, ...(cookie ? { 'Set-Cookie': cookie } : {}) } });
const readCookie = (request: Request) => request.headers.get('Cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);

export const onRequestPost = async ({ request, env }: PagesContext) => {
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return reply(403, { message: 'Deze herkomst is niet toegestaan.' });
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return reply(403, { message: 'Deze herkomst is niet toegestaan.' });

  const supabaseUrl = env.SUPABASE_URL || defaultSupabaseUrl;
  const publishableKey = env.SUPABASE_PUBLISHABLE_KEY || defaultPublishableKey;
  const gatewayHeaders = { apikey: publishableKey, 'Content-Type': 'application/json', 'x-forwarded-for': request.headers.get('CF-Connecting-IP') || 'unknown' };
  const body = await request.json().catch(() => ({})) as { action?: string; email?: string; password?: string; token?: string; redirectTo?: string; refreshToken?: string };
  const gateway = `${supabaseUrl}/functions/v1/auth-gateway`;

  if (body.action === 'logout') {
    const accessToken = request.headers.get('Authorization');
    if (accessToken?.startsWith('Bearer ')) {
      await fetch(`${supabaseUrl}/auth/v1/logout?scope=global`, { method: 'POST', headers: { apikey: publishableKey, Authorization: accessToken } }).catch(() => undefined);
    }
    return reply(200, { signedOut: true }, clearCookie);
  }

  let upstream: Response;
  if (body.action === 'refresh') {
    const encoded = readCookie(request);
    if (!encoded) return reply(401, { message: 'De sessie is verlopen.' }, clearCookie);
    let refreshToken='';
    try{refreshToken=decodeURIComponent(encoded)}catch{return reply(401,{message:'De sessie is verlopen.'},clearCookie)}
    upstream = await fetch(gateway, { method: 'POST', headers: gatewayHeaders, body: JSON.stringify({ action: 'refresh_session', refreshToken }) });
  } else if (body.action === 'adopt') {
    if (typeof body.refreshToken !== 'string' || !/^[^\s]{8,4096}$/.test(body.refreshToken)) return reply(400, { message: 'De sessie is niet geldig.' });
    upstream = await fetch(gateway, { method: 'POST', headers: gatewayHeaders, body: JSON.stringify({ action: 'refresh_session', refreshToken: body.refreshToken }) });
  } else if (body.action === 'sign_in') {
    upstream = await fetch(gateway, { method: 'POST', headers: gatewayHeaders, body: JSON.stringify({ action: 'sign_in', email: body.email, password: body.password }) });
  } else if (body.action === 'verify_recovery' || body.action === 'verify_invite') {
    upstream = await fetch(gateway, { method: 'POST', headers: gatewayHeaders, body: JSON.stringify({ action: body.action, email: body.email, token: body.token }) });
  } else {
    return reply(400, { message: 'De sessieaanvraag is niet geldig.' });
  }

  const result = await upstream.json().catch(() => ({})) as TokenResult;
  if (!upstream.ok || !result.access_token || !result.refresh_token) {
    return reply(upstream.status === 429 ? 429 : upstream.status === 401 ? 401 : 400, { message: result.message || 'De sessieaanvraag is niet gelukt.', code: result.code }, clearCookie);
  }
  return reply(200, { access_token: result.access_token, user: result.user }, sessionCookie(result.refresh_token));
};
// Alleen POST wordt bewust ondersteund; sessiegegevens mogen nooit via een URL worden aangeleverd.
