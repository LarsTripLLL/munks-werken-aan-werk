-- Maximaal vijf verificatiepogingen per nieuw uitgegeven herstelcode.
-- De sleutel is een SHA-256-hash van het genormaliseerde e-mailadres; het
-- e-mailadres zelf wordt niet in deze beveiligingstabel opgeslagen.

create table public.password_recovery_attempts (
  email_hash text primary key check (email_hash ~ '^[0-9a-f]{64}$'),
  issued_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts between 0 and 5)
);

alter table public.password_recovery_attempts enable row level security;
revoke all on table public.password_recovery_attempts from public, anon, authenticated;

create or replace function public.cleanup_password_recovery_attempts()
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  delete from public.password_recovery_attempts
  where issued_at<now()-interval '2 hours';
end;
$$;

revoke all on function public.cleanup_password_recovery_attempts() from public, anon, authenticated;

select cron.schedule(
  'munks-password-recovery-attempt-cleanup',
  '37 * * * *',
  'select public.cleanup_password_recovery_attempts()'
);
