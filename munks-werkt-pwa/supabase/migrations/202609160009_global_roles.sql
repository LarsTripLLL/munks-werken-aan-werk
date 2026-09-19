-- Globale applicatierollen die niet aan één traject zijn gekoppeld.
-- Trajectrollen blijven uitsluitend in trajectory_staff staan.

create table public.global_user_roles (
  user_id uuid not null references public.profiles(id) on delete restrict,
  role public.app_role not null,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role),
  check (role = 'functional_admin')
);

create index global_user_roles_active_idx
on public.global_user_roles(user_id)
where active;

alter table public.global_user_roles enable row level security;

revoke all on table public.global_user_roles from anon, authenticated;

comment on table public.global_user_roles is
'Server-only toekenning van globale applicatierollen. Niet rechtstreeks beschikbaar voor de browser.';

