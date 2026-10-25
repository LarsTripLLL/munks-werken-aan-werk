-- Gelijke begrenzing voor inloggen en wachtwoordherstel, onafhankelijk van het
-- bestaan van een account. De tabel bevat alleen SHA-256-sleutels van de
-- combinatie actie, e-mailadres en bronadres.

create table public.auth_gateway_limits (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  action text not null check (action in ('sign_in','request_reset')),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts>0)
);

alter table public.auth_gateway_limits enable row level security;
revoke all on table public.auth_gateway_limits from public, anon, authenticated;

create or replace function public.cleanup_auth_gateway_limits()
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  delete from public.auth_gateway_limits
  where window_started_at<now()-interval '1 day';
end;
$$;

revoke all on function public.cleanup_auth_gateway_limits() from public, anon, authenticated;

select cron.schedule(
  'munks-auth-gateway-limit-cleanup',
  '17 * * * *',
  'select public.cleanup_auth_gateway_limits()'
);
