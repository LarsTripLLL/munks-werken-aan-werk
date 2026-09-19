alter table public.profiles
  add column if not exists city text,
  add column if not exists age_years smallint;

alter table public.profiles
  add constraint profiles_age_years_range check (age_years is null or age_years between 0 and 120);
