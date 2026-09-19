-- Munks Werkt - rechten en berichtfuncties voor de toegewezen begeleider

create policy "assigned_coach_can_read_threads"
on public.message_threads for select to authenticated
using (assigned_coach_id = (select auth.uid()));

create policy "assigned_coach_can_read_messages"
on public.messages for select to authenticated
using (
  exists (
    select 1 from public.message_threads mt
    where mt.id = messages.thread_id
      and mt.assigned_coach_id = (select auth.uid())
  )
);

create or replace function public.reply_as_assigned_coach(
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

  select enrollment_id into v_enrollment_id
  from public.message_threads
  where id = p_thread_id
    and assigned_coach_id = auth.uid()
    and status <> 'closed';

  if v_enrollment_id is null then
    raise exception 'Geen toegang tot dit gesprek.' using errcode = '42501';
  end if;

  insert into public.messages (thread_id, sender_id, body, read_by_coach_at)
  values (p_thread_id, auth.uid(), btrim(p_body), now())
  returning id into v_message_id;

  update public.message_threads
  set status = 'open', updated_at = now(), handled_at = null
  where id = p_thread_id;

  insert into public.audit_log (
    actor_user_id, enrollment_id, action, data_category, target_table, target_id
  ) values (
    auth.uid(), v_enrollment_id, 'coach_message_sent', 'message', 'messages', v_message_id::text
  );

  return v_message_id;
end;
$$;

create or replace function public.mark_assigned_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.message_threads
    where id = p_thread_id and assigned_coach_id = auth.uid()
  ) then
    raise exception 'Geen toegang tot dit gesprek.' using errcode = '42501';
  end if;
  update public.messages
  set read_by_coach_at = coalesce(read_by_coach_at, now())
  where thread_id = p_thread_id and sender_id <> auth.uid();
end;
$$;

create or replace function public.mark_assigned_thread_handled(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enrollment_id uuid;
begin
  select enrollment_id into v_enrollment_id
  from public.message_threads
  where id = p_thread_id and assigned_coach_id = auth.uid();
  if v_enrollment_id is null then
    raise exception 'Geen toegang tot dit gesprek.' using errcode = '42501';
  end if;
  update public.message_threads
  set status = 'handled', handled_at = now(), updated_at = now()
  where id = p_thread_id;
  insert into public.audit_log (
    actor_user_id, enrollment_id, action, data_category, target_table, target_id
  ) values (
    auth.uid(), v_enrollment_id, 'thread_handled', 'message', 'message_threads', p_thread_id::text
  );
end;
$$;

revoke all on function public.reply_as_assigned_coach(uuid, text) from public, anon;
revoke all on function public.mark_assigned_thread_read(uuid) from public, anon;
revoke all on function public.mark_assigned_thread_handled(uuid) from public, anon;
grant execute on function public.reply_as_assigned_coach(uuid, text) to authenticated;
grant execute on function public.mark_assigned_thread_read(uuid) to authenticated;
grant execute on function public.mark_assigned_thread_handled(uuid) to authenticated;

