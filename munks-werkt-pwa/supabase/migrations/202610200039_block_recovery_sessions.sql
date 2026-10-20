-- Een recoverycode bewijst alleen toegang tot de mailbox en mag nooit als
-- normale applicatiesessie gelden. Een nieuw gekoppelde TOTP-factor wordt pas
-- bruikbaar nadat een andere applicatiebeheerder de identiteit heeft gecontroleerd.

create table if not exists public.mfa_factor_approvals (
  factor_id uuid primary key references auth.mfa_factors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz not null default now()
);

alter table public.mfa_factor_approvals enable row level security;
revoke all on table public.mfa_factor_approvals from public, anon, authenticated;

-- Bestaande, al in gebruik zijnde factors blijven werken. Alleen factors die
-- na deze migratie worden gekoppeld wachten op expliciete goedkeuring.
insert into public.mfa_factor_approvals (factor_id, user_id, approved_by, approved_at)
select factor.id, factor.user_id, null, now()
from auth.mfa_factors factor
where factor.status = 'verified'
on conflict (factor_id) do nothing;

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
  'Blokkeert recovery-sessies en niet-goedgekeurde MFA-factors. Staat AAL2 alleen toe met een door een andere beheerder goedgekeurde factor.';
