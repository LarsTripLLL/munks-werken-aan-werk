-- Documenten zijn uitsluitend bereikbaar via document-api. De browserrol mag
-- geen objecten uploaden, lezen, opsommen of ondertekenen.

drop policy if exists "participant_or_assigned_coach_can_upload_document" on storage.objects;
drop policy if exists "participant_or_assigned_coach_can_read_document" on storage.objects;

update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf']
where id = 'participant-documents';
