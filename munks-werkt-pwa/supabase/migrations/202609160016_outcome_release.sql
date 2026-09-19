-- Voorlopig en definitief uitstroomadvies met controleerbare vrijgave.

alter table public.enrollments
  add column exit_advice_status text,
  add column exit_advice_released_at timestamptz,
  add column exit_advice_released_by uuid references public.profiles(id) on delete restrict,
  add constraint enrollments_exit_advice_status_check
    check (exit_advice_status is null or exit_advice_status in ('provisional', 'final'));

