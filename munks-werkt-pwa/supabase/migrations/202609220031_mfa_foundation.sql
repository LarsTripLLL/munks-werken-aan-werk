-- Fase 1 van verplichte tweestapsverificatie.
-- Deze migratie verandert het inloggen nog niet en laat MFA standaard uit.
-- De instelling is niet rechtstreeks bereikbaar vanuit de browser. Een
-- gecontroleerde beheerroute wordt pas toegevoegd wanneer alle toegangsroutes
-- aantoonbaar AAL2 afdwingen.

create table public.app_security_settings (
  singleton boolean primary key default true check (singleton),
  mfa_required boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.app_security_settings (singleton, mfa_required)
values (true, false);

comment on table public.app_security_settings is
  'Centrale beveiligingsinstellingen. Alleen wijzigen via gecontroleerde serverlogica.';
comment on column public.app_security_settings.mfa_required is
  'Blijft uit totdat TOTP, herstel en AAL2-afscherming volledig zijn getest.';

alter table public.app_security_settings enable row level security;
revoke all on table public.app_security_settings from public, anon, authenticated;

create function public.mfa_access_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not coalesce(
    (select settings.mfa_required
     from public.app_security_settings settings
     where settings.singleton),
    false
  ) or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

comment on function public.mfa_access_allowed() is
  'Geeft toegang zolang MFA uit staat, of wanneer de Supabase-sessie AAL2 heeft.';
revoke all on function public.mfa_access_allowed() from public, anon;
grant execute on function public.mfa_access_allowed() to authenticated;

