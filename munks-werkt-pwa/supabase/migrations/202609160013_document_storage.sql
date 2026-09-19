-- Afgeschermde opslag voor documenten van deelnemers.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('participant-documents', 'participant-documents', false, 10485760, array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "participant_or_assigned_coach_can_upload_document"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'participant-documents'
  and exists (
    select 1 from public.enrollments e
    where e.id::text = (storage.foldername(name))[1]
      and (
        e.participant_id = (select auth.uid())
        or exists (
          select 1 from public.trajectory_staff ts
          where ts.trajectory_run_id = e.trajectory_run_id
            and ts.user_id = (select auth.uid())
            and ts.active
            and ts.role in ('primary_coach', 'trajectory_coach')
        )
      )
  )
);

create policy "participant_or_assigned_coach_can_read_document"
on storage.objects for select to authenticated
using (
  bucket_id = 'participant-documents'
  and exists (
    select 1 from public.enrollments e
    where e.id::text = (storage.foldername(name))[1]
      and (
        e.participant_id = (select auth.uid())
        or exists (
          select 1 from public.trajectory_staff ts
          where ts.trajectory_run_id = e.trajectory_run_id
            and ts.user_id = (select auth.uid())
            and ts.active
            and ts.role in ('primary_coach', 'trajectory_coach')
        )
      )
  )
);
