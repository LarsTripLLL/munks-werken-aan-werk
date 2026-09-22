-- Fase 3 van verplichte tweestapsverificatie.
-- Alle regels blijven feitelijk doorlatend zolang mfa_required=false.
-- Na latere activering moet iedere browsertoegang een Supabase AAL2-JWT hebben.

do $$
declare
  target record;
begin
  for target in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and rowsecurity
      and tablename <> 'app_security_settings'
  loop
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated using (public.mfa_access_allowed()) with check (public.mfa_access_allowed())',
      'mfa_required_for_authenticated',
      target.tablename
    );
  end loop;
end;
$$;

-- Deelnemersdocumenten worden rechtstreeks via Supabase Storage benaderd.
create policy "mfa_required_for_participant_documents"
on storage.objects
as restrictive
for all
to authenticated
using (bucket_id <> 'participant-documents' or public.mfa_access_allowed())
with check (bucket_id <> 'participant-documents' or public.mfa_access_allowed());

-- De bericht-RPC's zijn security-definer functies en controleren daarom
-- expliciet zowel de accountstatus als het vereiste beveiligingsniveau.
create or replace function public.message_account_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.mfa_access_allowed()
    and auth.uid() is not null
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and account_active
    );
$$;

-- Deze oudere schrijffuncties gebruikt de app niet meer; rechtstreeks gebruik
-- zou de centrale session-api en daarmee de MFA-controle kunnen omzeilen.
revoke execute on function public.save_my_answer(text, text, text, jsonb, boolean)
from authenticated;
revoke execute on function public.save_my_measurement(
  text,
  public.measurement_moment,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint
) from authenticated;

