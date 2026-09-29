-- Een ondertekend JWT blijft na uitloggen geldig tot de vervaldatum.
-- Controleer daarom voor iedere browsertoegang of de bijbehorende Supabase-
-- sessie nog bestaat. De bestaande restrictieve MFA-policies gebruiken deze
-- functie al voor alle publieke tabellen en voor deelnemersdocumenten.

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
      not coalesce(
        (select settings.mfa_required
         from public.app_security_settings settings
         where settings.singleton),
        false
      )
      or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    );
$$;

comment on function public.mfa_access_allowed() is
  'Geeft alleen toegang aan een nog bestaande Supabase-sessie die tevens aan de MFA-instelling voldoet.';

