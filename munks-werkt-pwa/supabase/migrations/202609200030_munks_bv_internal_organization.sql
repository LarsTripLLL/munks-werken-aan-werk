-- Munks BV is the internal organization; Munks Werkt remains the program name.
-- Only rename staff records, never participants or commissioner accounts.
-- The guard also preserves a real commissioner should one later use this name.
update public.profiles
set organization_name = 'Munks BV', updated_at = now()
where organization_name = 'Munks Werkt'
  and (
    exists (
      select 1 from public.global_user_roles
      where user_id = profiles.id and role = 'functional_admin'
    )
    or exists (
      select 1 from public.trajectory_staff
      where user_id = profiles.id
        and role in ('primary_coach', 'trajectory_coach', 'project_leader')
    )
  )
  and not exists (
    select 1 from public.organizations where name = 'Munks Werkt'
  );
