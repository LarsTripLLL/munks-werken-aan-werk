-- Munks Werkt - kernschema pilot 0.1
-- Doelplatform: PostgreSQL / Supabase
-- Dit bestand maakt tabellen en een gesloten autorisatiebasis.

create extension if not exists pgcrypto;

create type public.app_role as enum (
  'participant',
  'primary_coach',
  'trajectory_coach',
  'project_leader',
  'rsd_user',
  'functional_admin'
);

create type public.trajectory_status as enum (
  'draft', 'planned', 'active', 'completed', 'cancelled'
);

create type public.enrollment_status as enum (
  'invited', 'active', 'paused', 'stopped', 'completed'
);

create type public.step_status as enum (
  'not_started', 'in_progress', 'completed', 'skipped'
);

create type public.attendance_status as enum (
  'present', 'absent', 'not_applicable', 'unknown'
);

create type public.goal_result as enum (
  'yes', 'partial', 'no', 'not_assessed'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  account_active boolean not null default true,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trajectory_runs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id),
  organization_id uuid not null references public.organizations(id),
  code text not null unique,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  location text,
  capacity smallint not null default 6 check (capacity between 1 and 100),
  status public.trajectory_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.trajectory_staff (
  trajectory_run_id uuid not null references public.trajectory_runs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  role public.app_role not null,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (trajectory_run_id, user_id, role),
  check (role in ('primary_coach', 'trajectory_coach', 'project_leader', 'rsd_user'))
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  trajectory_run_id uuid not null references public.trajectory_runs(id) on delete restrict,
  participant_id uuid not null references public.profiles(id) on delete restrict,
  primary_coach_id uuid references public.profiles(id) on delete restrict,
  internal_reference text,
  rsd_reference text,
  status public.enrollment_status not null default 'invited',
  invited_at timestamptz,
  activated_at timestamptz,
  stopped_reason text,
  goals_result public.goal_result not null default 'not_assessed',
  exit_category text,
  exit_advice_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trajectory_run_id, participant_id)
);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  step_number smallint not null check (step_number between 1 and 7),
  title text not null,
  slug text not null,
  active boolean not null default true,
  unique (program_id, step_number),
  unique (program_id, slug)
);

create table public.enrollment_steps (
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  step_id uuid not null references public.steps(id) on delete restrict,
  status public.step_status not null default 'not_started',
  attendance public.attendance_status not null default 'unknown',
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (enrollment_id, step_id)
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  enrollment_id uuid references public.enrollments(id) on delete restrict,
  document_type text not null check (document_type in ('privacy_notice', 'consent_form')),
  document_version text not null,
  accepted boolean not null,
  recorded_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique (user_id, enrollment_id, document_type, document_version)
);

create table public.activation_invites (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  attempts smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  trajectory_run_id uuid references public.trajectory_runs(id) on delete set null,
  enrollment_id uuid references public.enrollments(id) on delete set null,
  action text not null,
  data_category text not null,
  target_table text,
  target_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index enrollments_participant_idx on public.enrollments(participant_id);
create index enrollments_trajectory_idx on public.enrollments(trajectory_run_id);
create index trajectory_staff_user_idx on public.trajectory_staff(user_id) where active;
create index audit_log_enrollment_time_idx on public.audit_log(enrollment_id, occurred_at desc);

-- RLS wordt op iedere via de browser bereikbare tabel ingeschakeld.
alter table public.organizations enable row level security;
alter table public.programs enable row level security;
alter table public.profiles enable row level security;
alter table public.trajectory_runs enable row level security;
alter table public.trajectory_staff enable row level security;
alter table public.enrollments enable row level security;
alter table public.steps enable row level security;
alter table public.enrollment_steps enable row level security;
alter table public.consents enable row level security;
alter table public.activation_invites enable row level security;
alter table public.audit_log enable row level security;

-- Grants en policies werken samen. De browser krijgt uitsluitend expliciete
-- leesrechten; mutaties volgen later via gecontroleerde functies/policies.
revoke all on table
  public.organizations,
  public.programs,
  public.profiles,
  public.trajectory_runs,
  public.trajectory_staff,
  public.enrollments,
  public.steps,
  public.enrollment_steps,
  public.consents,
  public.activation_invites,
  public.audit_log
from anon, authenticated;

grant select on table
  public.programs,
  public.profiles,
  public.trajectory_runs,
  public.enrollments,
  public.steps,
  public.enrollment_steps,
  public.consents
to authenticated;

-- Standaard gesloten: activation_invites en audit_log krijgen bewust geen
-- browserbeleid. Gebruik hiervoor uitsluitend gecontroleerde serverfuncties.

create policy "authenticated_can_read_active_programs"
on public.programs for select to authenticated
using ((select auth.uid()) is not null and active);

create policy "authenticated_can_read_active_steps"
on public.steps for select to authenticated
using ((select auth.uid()) is not null and active);

create policy "profile_owner_can_read"
on public.profiles for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "participant_can_read_own_enrollments"
on public.enrollments for select to authenticated
using ((select auth.uid()) is not null and participant_id = (select auth.uid()));

create policy "participant_can_read_own_trajectory"
on public.trajectory_runs for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.trajectory_run_id = trajectory_runs.id
      and e.participant_id = (select auth.uid())
  )
);

create policy "participant_can_read_own_steps"
on public.enrollment_steps for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_steps.enrollment_id
      and e.participant_id = (select auth.uid())
  )
);

create policy "participant_can_read_own_consents"
on public.consents for select to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

-- Medewerkerbeleid wordt pas toegevoegd na vaststelling van de
-- autorisatiematrix. Tot dat moment verloopt beheer via serverfuncties.

-- Vaste pilotinhoud.
insert into public.programs (name) values ('Munks Werkt');

with program as (
  select id from public.programs where name = 'Munks Werkt'
)
insert into public.steps (program_id, step_number, title, slug)
select program.id, value.step_number, value.title, value.slug
from program
cross join (values
  (1, 'Kennismaken', 'kennismaken'),
  (2, 'Ontdek je talenten', 'talenten'),
  (3, 'Maak je cv', 'cv-maken'),
  (4, 'Bespreek je cv', 'cv-bespreken'),
  (5, 'Werk zoeken en reageren', 'werk-zoeken'),
  (6, 'Bereid een gesprek voor', 'gesprek-voorbereiden'),
  (7, 'Bekijk je mogelijkheden', 'mogelijkheden')
) as value(step_number, title, slug);
