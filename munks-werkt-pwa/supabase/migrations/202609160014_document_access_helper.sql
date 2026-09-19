-- Beperkte toegangscontrole voor Storage zonder tabellen aan browserrollen vrij te geven.

create or replace function public.can_access_enrollment_documents(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.id = p_enrollment_id
      and (
        e.participant_id = auth.uid()
        or exists (
          select 1
          from public.trajectory_staff ts
          where ts.trajectory_run_id = e.trajectory_run_id
            and ts.user_id = auth.uid()
            and ts.active
            and ts.role in ('primary_coach', 'trajectory_coach')
        )
      )
  );
$$;

revoke all on function public.can_access_enrollment_documents(uuid) from public, anon;
grant execute on function public.can_access_enrollment_documents(uuid) to authenticated;

drop policy if exists "participant_or_assigned_coach_can_upload_document" on storage.objects;
create policy "participant_or_assigned_coach_can_upload_document"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'participant-documents'
  and public.can_access_enrollment_documents(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "participant_or_assigned_coach_can_read_document" on storage.objects;
create policy "participant_or_assigned_coach_can_read_document"
on storage.objects for select to authenticated
using (
  bucket_id = 'participant-documents'
  and public.can_access_enrollment_documents(((storage.foldername(name))[1])::uuid)
);
