-- Status en toestemming rond de externe talententest.

create type public.talent_consent_choice as enum ('accepted', 'discuss');

create table public.talent_test_status (
  enrollment_id uuid primary key references public.enrollments(id) on delete cascade,
  consent_choice public.talent_consent_choice,
  consent_recorded_at timestamptz,
  completed_at timestamptz,
  results_released_at timestamptz,
  results_released_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

alter table public.talent_test_status enable row level security;
revoke all on table public.talent_test_status from anon, authenticated;

-- Deze status loopt uitsluitend via session-api. Zo zijn testgegevens niet
-- rechtstreeks via de browser opvraagbaar, ook niet met een geldige sessie.
