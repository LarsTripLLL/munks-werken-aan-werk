-- Munks Werkt - afspraken, documenten, berichten en hulpvragen
-- Voer dit bestand uit na 004_pilot_content.sql.

create type public.appointment_kind as enum ('group_meeting', 'individual', 'other');
create type public.thread_kind as enum ('message', 'help_request');
create type public.thread_status as enum ('open', 'handled', 'closed');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  trajectory_run_id uuid not null references public.trajectory_runs(id) on delete cascade,
  step_id uuid references public.steps(id) on delete restrict,
  coach_id uuid references public.profiles(id) on delete restrict,
  kind public.appointment_kind not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.appointment_participants (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  attendance public.attendance_status not null default 'unknown',
  attendance_recorded_by uuid references public.profiles(id) on delete restrict,
  attendance_recorded_at timestamptz,
  primary key (appointment_id, enrollment_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  document_type text not null,
  display_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  participant_visible boolean not null default true,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  kind public.thread_kind not null default 'message',
  subject text not null,
  status public.thread_status not null default 'open',
  created_by uuid not null references public.profiles(id) on delete restrict,
  assigned_coach_id uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  handled_at timestamptz,
  closed_at timestamptz
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_by_participant_at timestamptz,
  read_by_coach_at timestamptz
);

create index appointments_trajectory_start_idx on public.appointments(trajectory_run_id, starts_at);
create index appointment_participants_enrollment_idx on public.appointment_participants(enrollment_id);
create index documents_enrollment_created_idx on public.documents(enrollment_id, created_at desc);
create index message_threads_enrollment_updated_idx on public.message_threads(enrollment_id, updated_at desc);
create index messages_thread_created_idx on public.messages(thread_id, created_at);

alter table public.appointments enable row level security;
alter table public.appointment_participants enable row level security;
alter table public.documents enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;

revoke all on table
  public.appointments,
  public.appointment_participants,
  public.documents,
  public.message_threads,
  public.messages
from anon, authenticated;

grant select on table
  public.appointments,
  public.appointment_participants,
  public.documents,
  public.message_threads,
  public.messages
to authenticated;

create policy "participant_can_read_own_appointment_links"
on public.appointment_participants for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = appointment_participants.enrollment_id
      and e.participant_id = (select auth.uid())
  )
);

create policy "participant_can_read_own_appointments"
on public.appointments for select to authenticated
using (
  exists (
    select 1
    from public.appointment_participants ap
    join public.enrollments e on e.id = ap.enrollment_id
    where ap.appointment_id = appointments.id
      and e.participant_id = (select auth.uid())
  )
);

create policy "participant_can_read_own_visible_documents"
on public.documents for select to authenticated
using (
  participant_visible
  and archived_at is null
  and exists (
    select 1 from public.enrollments e
    where e.id = documents.enrollment_id
      and e.participant_id = (select auth.uid())
  )
);

create policy "participant_can_read_own_threads"
on public.message_threads for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = message_threads.enrollment_id
      and e.participant_id = (select auth.uid())
  )
);

create policy "participant_can_read_own_messages"
on public.messages for select to authenticated
using (
  exists (
    select 1
    from public.message_threads mt
    join public.enrollments e on e.id = mt.enrollment_id
    where mt.id = messages.thread_id
      and e.participant_id = (select auth.uid())
  )
);

-- Mutaties en het ophalen van een tijdelijk downloadadres voor documenten
-- verlopen uitsluitend via gecontroleerde serverfuncties.

