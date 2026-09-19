-- Uitsluitend fictieve testgegevens voor de pilotomgeving.
-- De vier auth-gebruikers worden vooraf handmatig in Supabase aangemaakt.

do $$
declare
  missing_emails text;
begin
  select string_agg(required.email, ', ' order by required.email)
  into missing_emails
  from (values
    ('test-deelnemer@example.com'),
    ('test-begeleider@example.com'),
    ('test-beheerder@example.com'),
    ('test-opdrachtgever@example.com')
  ) as required(email)
  where not exists (
    select 1 from auth.users users where lower(users.email) = required.email
  );

  if missing_emails is not null then
    raise exception 'Ontbrekende fictieve auth-gebruikers: %', missing_emails;
  end if;
end
$$;

insert into public.profiles (id, first_name, last_name, email, account_active)
select
  users.id,
  case lower(users.email)
    when 'test-deelnemer@example.com' then 'Test'
    when 'test-begeleider@example.com' then 'Test'
    when 'test-beheerder@example.com' then 'Test'
    when 'test-opdrachtgever@example.com' then 'Test'
  end,
  case lower(users.email)
    when 'test-deelnemer@example.com' then 'Deelnemer'
    when 'test-begeleider@example.com' then 'Begeleider'
    when 'test-beheerder@example.com' then 'Applicatiebeheerder'
    when 'test-opdrachtgever@example.com' then 'Opdrachtgever'
  end,
  lower(users.email),
  true
from auth.users users
where lower(users.email) in (
  'test-deelnemer@example.com',
  'test-begeleider@example.com',
  'test-beheerder@example.com',
  'test-opdrachtgever@example.com'
)
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  account_active = true,
  updated_at = now();

insert into public.organizations (name, code, active)
values ('Fictieve Testopdrachtgever', 'TESTORG', true)
on conflict (code) do update set
  name = excluded.name,
  active = true,
  updated_at = now();

insert into public.trajectory_runs (
  program_id,
  organization_id,
  code,
  name,
  starts_on,
  ends_on,
  location,
  capacity,
  status
)
select
  programs.id,
  organizations.id,
  'MW-TESTORG-001',
  'Fictief testtraject',
  date '2026-09-01',
  date '2026-10-20',
  'Testlocatie',
  6,
  'active'::public.trajectory_status
from public.programs programs
cross join public.organizations organizations
where programs.name = 'Munks Werkt'
  and organizations.code = 'TESTORG'
on conflict (code) do update set
  name = excluded.name,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  location = excluded.location,
  capacity = excluded.capacity,
  status = excluded.status,
  updated_at = now();

insert into public.global_user_roles (user_id, role, active)
select users.id, 'functional_admin'::public.app_role, true
from auth.users users
where lower(users.email) = 'test-beheerder@example.com'
on conflict (user_id, role) do update set
  active = true,
  revoked_at = null;

insert into public.trajectory_staff (trajectory_run_id, user_id, role, active)
select trajectory_runs.id, users.id, role_data.role, true
from public.trajectory_runs trajectory_runs
cross join lateral (values
  ('test-begeleider@example.com', 'primary_coach'::public.app_role),
  ('test-opdrachtgever@example.com', 'rsd_user'::public.app_role)
) as role_data(email, role)
join auth.users users on lower(users.email) = role_data.email
where trajectory_runs.code = 'MW-TESTORG-001'
on conflict (trajectory_run_id, user_id, role) do update set
  active = true,
  revoked_at = null;

insert into public.enrollments (
  trajectory_run_id,
  participant_id,
  primary_coach_id,
  internal_reference,
  status,
  invited_at,
  activated_at
)
select
  trajectory_runs.id,
  participant.id,
  coach.id,
  'TEST-DEELNEMER-001',
  'active'::public.enrollment_status,
  now(),
  now()
from public.trajectory_runs trajectory_runs
join auth.users participant
  on lower(participant.email) = 'test-deelnemer@example.com'
join auth.users coach
  on lower(coach.email) = 'test-begeleider@example.com'
where trajectory_runs.code = 'MW-TESTORG-001'
on conflict (trajectory_run_id, participant_id) do update set
  primary_coach_id = excluded.primary_coach_id,
  status = 'active'::public.enrollment_status,
  updated_at = now();

insert into public.enrollment_steps (enrollment_id, step_id)
select enrollments.id, steps.id
from public.enrollments enrollments
join public.trajectory_runs trajectory_runs
  on trajectory_runs.id = enrollments.trajectory_run_id
join public.steps steps
  on steps.program_id = trajectory_runs.program_id
where trajectory_runs.code = 'MW-TESTORG-001'
on conflict (enrollment_id, step_id) do nothing;
