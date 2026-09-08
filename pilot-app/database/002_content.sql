-- Munks Werkt - vragen, antwoorden, opdrachten en metingen
-- Voer dit bestand uit na 001_core_schema.sql.

create type public.content_kind as enum (
  'information',
  'question',
  'assignment'
);

create type public.answer_visibility as enum (
  'participant_and_coaches',
  'participant_only',
  'participant_coaches_and_project_leader'
);

create type public.measurement_moment as enum ('start', 'end');

create table public.step_content (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.steps(id) on delete cascade,
  content_key text not null,
  kind public.content_kind not null,
  title text not null,
  prompt text,
  helper_text text,
  sort_order smallint not null check (sort_order > 0),
  answer_visibility public.answer_visibility,
  skippable boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (step_id, content_key),
  unique (step_id, sort_order),
  check (
    (kind = 'information' and answer_visibility is null)
    or (kind <> 'information' and answer_visibility is not null)
  )
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  content_id uuid not null references public.step_content(id) on delete restrict,
  answer_text text,
  answer_data jsonb,
  skipped boolean not null default false,
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_id, content_id),
  check (
    skipped
    or nullif(btrim(answer_text), '') is not null
    or answer_data is not null
  )
);

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  moment public.measurement_moment not null,
  support_confidence smallint not null check (support_confidence between 1 and 10),
  self_confidence smallint not null check (self_confidence between 1 and 10),
  motivation smallint not null check (motivation between 1 and 10),
  future_perspective smallint not null check (future_perspective between 1 and 10),
  employee_skills smallint not null check (employee_skills between 1 and 10),
  measured_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_id, moment)
);

create index answers_enrollment_idx on public.answers(enrollment_id);
create index measurements_enrollment_idx on public.measurements(enrollment_id);

alter table public.step_content enable row level security;
alter table public.answers enable row level security;
alter table public.measurements enable row level security;

revoke all on table public.step_content, public.answers, public.measurements
from anon, authenticated;

grant select on table public.step_content, public.answers, public.measurements
to authenticated;

create policy "authenticated_can_read_active_step_content"
on public.step_content for select to authenticated
using (
  active
  and exists (
    select 1
    from public.steps s
    where s.id = step_content.step_id
      and s.active
  )
);

create policy "participant_can_read_own_answers"
on public.answers for select to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    where e.id = answers.enrollment_id
      and e.participant_id = (select auth.uid())
  )
);

create policy "participant_can_read_own_measurements"
on public.measurements for select to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    where e.id = measurements.enrollment_id
      and e.participant_id = (select auth.uid())
  )
);

-- Schrijven verloopt via beveiligde serverfuncties. Er worden daarom bewust
-- geen INSERT-, UPDATE- of DELETE-rechten aan de browserrollen verleend.

