-- Een bekend opslagpad mag geen toegang geven aan een voormalige begeleider.
-- Deze functie wordt gebruikt door de bestaande lees- en uploadregels van Storage.
create or replace function public.can_access_enrollment_documents(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.profiles viewer
      where viewer.id = auth.uid() and viewer.account_active
    )
    and exists (
      select 1
      from public.enrollments e
      where e.id = p_enrollment_id
        and (
          e.participant_id = auth.uid()
          or (
            e.primary_coach_id = auth.uid()
            and exists (
              select 1 from public.trajectory_staff ts
              where ts.trajectory_run_id = e.trajectory_run_id
                and ts.user_id = auth.uid()
                and ts.active
                and ts.role in ('primary_coach', 'trajectory_coach')
            )
          )
        )
    );
$$;
