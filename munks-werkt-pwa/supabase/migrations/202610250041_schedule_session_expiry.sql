-- De ingebouwde Supabase-session-timebox vereist een Pro-abonnement.
-- Deze taak biedt op Free dezelfde harde bovengrens voor de applicatie:
-- iedere vijf minuten worden sessies ouder dan acht uur ingetrokken.

create extension if not exists pg_cron;

create or replace function public.cleanup_expired_auth_sessions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.sessions
  where created_at <= now() - interval '8 hours';
end;
$$;

revoke all on function public.cleanup_expired_auth_sessions() from public, anon, authenticated;

select cron.schedule(
  'munks-auth-session-expiry-8h',
  '*/5 * * * *',
  'select public.cleanup_expired_auth_sessions()'
);

comment on function public.cleanup_expired_auth_sessions() is
  'Trekt op het Free-abonnement alle Supabase-sessies uiterlijk vijf minuten na hun maximale levensduur van acht uur in.';
