alter table public.profiles
  add column if not exists organization_name text;

comment on column public.profiles.organization_name is
  'De organisatie waaraan een beheerder, begeleider of opdrachtgever is gekoppeld.';
