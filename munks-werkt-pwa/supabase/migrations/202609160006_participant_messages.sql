-- Munks Werkt - veilige berichtfuncties voor deelnemers
-- De deelnemer en deelname worden altijd uit de beveiligde sessie bepaald.

create or replace function public.start_my_thread(
  p_trajectory_code text,
  p_kind public.thread_kind,
  p_subject text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enrollment public.enrollments;
  v_thread_id uuid;
  v_message_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Aanmelden is vereist.' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_subject, ''))) not between 1 and 120 then
    raise exception 'Vul een kort onderwerp in.' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 5000 then
    raise exception 'Vul een bericht in van maximaal 5000 tekens.' using errcode = '22023';
  end if;

  select e.* into v_enrollment
  from public.enrollments e
  join public.trajectory_runs tr on tr.id = e.trajectory_run_id
  where e.participant_id = auth.uid()
    and tr.code = p_trajectory_code
    and e.status in ('invited', 'active', 'paused')
  limit 1;

  if v_enrollment.id is null then
    raise exception 'Geen toegestane deelname gevonden.' using errcode = '42501';
  end if;

  insert into public.message_threads (
    enrollment_id, kind, subject, created_by, assigned_coach_id
  ) values (
    v_enrollment.id, p_kind, btrim(p_subject), auth.uid(), v_enrollment.primary_coach_id
  ) returning id into v_thread_id;

  insert into public.messages (thread_id, sender_id, body, read_by_participant_at)
  values (v_thread_id, auth.uid(), btrim(p_body), now())
  returning id into v_message_id;

  insert into public.audit_log (
    actor_user_id, enrollment_id, action, data_category, target_table, target_id,
    metadata
  ) values (
    auth.uid(), v_enrollment.id, 'thread_started', 'message', 'message_threads',
    v_thread_id::text, jsonb_build_object('kind', p_kind, 'message_id', v_message_id)
  );

  return v_thread_id;
end;
$$;

create or replace function public.reply_to_my_thread(
  p_thread_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enrollment_id uuid;
  v_message_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Aanmelden is vereist.' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 5000 then
    raise exception 'Vul een bericht in van maximaal 5000 tekens.' using errcode = '22023';
  end if;

  select mt.enrollment_id into v_enrollment_id
  from public.message_threads mt
  join public.enrollments e on e.id = mt.enrollment_id
  where mt.id = p_thread_id
    and e.participant_id = auth.uid()
    and mt.status <> 'closed';

  if v_enrollment_id is null then
    raise exception 'Gesprek niet gevonden of gesloten.' using errcode = '42501';
  end if;

  insert into public.messages (thread_id, sender_id, body, read_by_participant_at)
  values (p_thread_id, auth.uid(), btrim(p_body), now())
  returning id into v_message_id;

  update public.message_threads
  set status = 'open', updated_at = now(), handled_at = null
  where id = p_thread_id;

  insert into public.audit_log (
    actor_user_id, enrollment_id, action, data_category, target_table, target_id
  ) values (
    auth.uid(), v_enrollment_id, 'message_sent', 'message', 'messages', v_message_id::text
  );

  return v_message_id;
end;
$$;

create or replace function public.mark_my_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.message_threads mt
    join public.enrollments e on e.id = mt.enrollment_id
    where mt.id = p_thread_id
      and e.participant_id = auth.uid()
  ) then
    raise exception 'Gesprek niet gevonden.' using errcode = '42501';
  end if;

  update public.messages
  set read_by_participant_at = coalesce(read_by_participant_at, now())
  where thread_id = p_thread_id
    and sender_id <> auth.uid();
end;
$$;

revoke all on function public.start_my_thread(text, public.thread_kind, text, text) from public, anon;
revoke all on function public.reply_to_my_thread(uuid, text) from public, anon;
revoke all on function public.mark_my_thread_read(uuid) from public, anon;

grant execute on function public.start_my_thread(text, public.thread_kind, text, text) to authenticated;
grant execute on function public.reply_to_my_thread(uuid, text) to authenticated;
grant execute on function public.mark_my_thread_read(uuid) to authenticated;

