alter table public.appointments
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id) on delete restrict;

create index if not exists appointments_active_trajectory_start_idx
  on public.appointments(trajectory_run_id, starts_at)
  where cancelled_at is null;
