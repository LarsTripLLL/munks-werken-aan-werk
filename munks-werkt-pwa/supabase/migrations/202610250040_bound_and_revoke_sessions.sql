-- Beperk de gevolgen van buitgemaakte sessies.
-- 1. Elke wachtwoordwijziging trekt alle bestaande sessies van het account in.
-- 2. Applicatiedata is alleen bereikbaar met een sessie die jonger is dan 8 uur.

create or replace function public.revoke_sessions_after_password_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.encrypted_password is distinct from new.encrypted_password then
    delete from auth.sessions where user_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.revoke_sessions_after_password_change() from public, anon, authenticated;

drop trigger if exists revoke_sessions_after_password_change on auth.users;
create trigger revoke_sessions_after_password_change
after update of encrypted_password on auth.users
for each row
when (old.encrypted_password is distinct from new.encrypted_password)
execute function public.revoke_sessions_after_password_change();

create or replace function public.mfa_access_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and nullif(auth.jwt() ->> 'session_id', '') is not null
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) method
      where method ->> 'method' = 'recovery'
    )
    and exists (
      select 1
      from auth.sessions auth_session
      where auth_session.id = (auth.jwt() ->> 'session_id')::uuid
        and auth_session.user_id = auth.uid()
        and auth_session.created_at > now() - interval '8 hours'
    )
    and (
      (
        coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
        and exists (
          select 1
          from auth.mfa_factors factor
          join public.mfa_factor_approvals approval
            on approval.factor_id = factor.id
           and approval.user_id = factor.user_id
          where factor.user_id = auth.uid()
            and factor.status = 'verified'
        )
      )
      or (
        not coalesce(
          (select settings.mfa_required
           from public.app_security_settings settings
           where settings.singleton),
          false
        )
        and not exists (
          select 1
          from auth.mfa_factors factor
          where factor.user_id = auth.uid()
            and factor.status = 'verified'
        )
      )
    );
$$;

comment on function public.mfa_access_allowed() is
  'Blokkeert recovery-, ingetrokken en ouder-dan-8-uur sessies en vereist een goedgekeurde MFA-factor waar van toepassing.';
