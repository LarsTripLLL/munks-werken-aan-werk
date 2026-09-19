-- Eenmalig herstel: activeer bestaande applicatiebeheerders opnieuw.
update public.global_user_roles
set active = true,
    revoked_at = null
where role = 'functional_admin'
  and revoked_at is null;

update public.profiles
set account_active = true,
    updated_at = now()
where id in (
  select user_id
  from public.global_user_roles
  where role = 'functional_admin'
    and active
);
