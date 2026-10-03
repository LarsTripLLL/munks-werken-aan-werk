-- Een bestaande, geverifieerde authenticator blijft altijd verplicht.
-- De centrale schakelaar bepaalt alleen of accounts zonder factor er een
-- moeten koppelen en mag bestaande accounts niet naar AAL1 terugbrengen.

create or replace function public.mfa_access_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and nullif(auth.jwt() ->> 'session_id', '') is not null
    and exists (
      select 1
      from auth.sessions auth_session
      where auth_session.id = (auth.jwt() ->> 'session_id')::uuid
        and auth_session.user_id = auth.uid()
    )
    and (
      coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
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
  'Geeft alleen toegang aan een bestaande sessie op AAL2, behalve wanneer MFA niet verplicht is en het account nog geen geverifieerde factor heeft.';
