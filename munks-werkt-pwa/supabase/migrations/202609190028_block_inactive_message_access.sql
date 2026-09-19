-- Een bestaande JWT geeft geen berichttoegang meer nadat een account inactief is gemaakt.
create function public.message_account_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles
    where id = auth.uid() and account_active
  );
$$;

revoke all on function public.message_account_active() from public, anon;
grant execute on function public.message_account_active() to authenticated;

-- De bestaande functies behouden hun gedrag, maar zijn niet meer rechtstreeks aanroepbaar.
alter function public.start_my_thread(text, public.thread_kind, text, text) rename to start_my_thread_unchecked;
alter function public.reply_to_my_thread(uuid, text) rename to reply_to_my_thread_unchecked;
alter function public.mark_my_thread_read(uuid) rename to mark_my_thread_read_unchecked;
alter function public.reply_as_assigned_coach(uuid, text) rename to reply_as_assigned_coach_unchecked;
alter function public.mark_assigned_thread_read(uuid) rename to mark_assigned_thread_read_unchecked;
alter function public.mark_assigned_thread_handled(uuid) rename to mark_assigned_thread_handled_unchecked;
alter function public.list_my_message_threads() rename to list_my_message_threads_unchecked;
alter function public.list_my_assigned_threads(text) rename to list_my_assigned_threads_unchecked;

revoke all on function public.start_my_thread_unchecked(text, public.thread_kind, text, text) from public, anon, authenticated;
revoke all on function public.reply_to_my_thread_unchecked(uuid, text) from public, anon, authenticated;
revoke all on function public.mark_my_thread_read_unchecked(uuid) from public, anon, authenticated;
revoke all on function public.reply_as_assigned_coach_unchecked(uuid, text) from public, anon, authenticated;
revoke all on function public.mark_assigned_thread_read_unchecked(uuid) from public, anon, authenticated;
revoke all on function public.mark_assigned_thread_handled_unchecked(uuid) from public, anon, authenticated;
revoke all on function public.list_my_message_threads_unchecked() from public, anon, authenticated;
revoke all on function public.list_my_assigned_threads_unchecked(text) from public, anon, authenticated;

create function public.start_my_thread(p_trajectory_code text, p_kind public.thread_kind, p_subject text, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if not public.message_account_active() then raise exception 'Dit account is niet actief.' using errcode = '42501'; end if;
  return public.start_my_thread_unchecked(p_trajectory_code, p_kind, p_subject, p_body);
end;
$$;

create function public.reply_to_my_thread(p_thread_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if not public.message_account_active() then raise exception 'Dit account is niet actief.' using errcode = '42501'; end if;
  return public.reply_to_my_thread_unchecked(p_thread_id, p_body);
end;
$$;

create function public.mark_my_thread_read(p_thread_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.message_account_active() then raise exception 'Dit account is niet actief.' using errcode = '42501'; end if;
  perform public.mark_my_thread_read_unchecked(p_thread_id);
end;
$$;

create function public.reply_as_assigned_coach(p_thread_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if not public.message_account_active() then raise exception 'Dit account is niet actief.' using errcode = '42501'; end if;
  return public.reply_as_assigned_coach_unchecked(p_thread_id, p_body);
end;
$$;

create function public.mark_assigned_thread_read(p_thread_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.message_account_active() then raise exception 'Dit account is niet actief.' using errcode = '42501'; end if;
  perform public.mark_assigned_thread_read_unchecked(p_thread_id);
end;
$$;

create function public.mark_assigned_thread_handled(p_thread_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.message_account_active() then raise exception 'Dit account is niet actief.' using errcode = '42501'; end if;
  perform public.mark_assigned_thread_handled_unchecked(p_thread_id);
end;
$$;

create function public.list_my_message_threads()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.message_account_active() then raise exception 'Dit account is niet actief.' using errcode = '42501'; end if;
  return public.list_my_message_threads_unchecked();
end;
$$;

create function public.list_my_assigned_threads(p_trajectory_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.message_account_active() then raise exception 'Dit account is niet actief.' using errcode = '42501'; end if;
  return public.list_my_assigned_threads_unchecked(p_trajectory_code);
end;
$$;

revoke all on function public.start_my_thread(text, public.thread_kind, text, text) from public, anon;
revoke all on function public.reply_to_my_thread(uuid, text) from public, anon;
revoke all on function public.mark_my_thread_read(uuid) from public, anon;
revoke all on function public.reply_as_assigned_coach(uuid, text) from public, anon;
revoke all on function public.mark_assigned_thread_read(uuid) from public, anon;
revoke all on function public.mark_assigned_thread_handled(uuid) from public, anon;
revoke all on function public.list_my_message_threads() from public, anon;
revoke all on function public.list_my_assigned_threads(text) from public, anon;
grant execute on function public.start_my_thread(text, public.thread_kind, text, text) to authenticated;
grant execute on function public.reply_to_my_thread(uuid, text) to authenticated;
grant execute on function public.mark_my_thread_read(uuid) to authenticated;
grant execute on function public.reply_as_assigned_coach(uuid, text) to authenticated;
grant execute on function public.mark_assigned_thread_read(uuid) to authenticated;
grant execute on function public.mark_assigned_thread_handled(uuid) to authenticated;
grant execute on function public.list_my_message_threads() to authenticated;
grant execute on function public.list_my_assigned_threads(text) to authenticated;

-- Ook rechtstreeks lezen via de tabellen moet de actuele accountstatus respecteren.
drop policy if exists "participant_can_read_own_threads" on public.message_threads;
create policy "participant_can_read_own_threads" on public.message_threads for select to authenticated
using (public.message_account_active() and exists (
  select 1 from public.enrollments e
  where e.id = message_threads.enrollment_id and e.participant_id = auth.uid()
));

drop policy if exists "participant_can_read_own_messages" on public.messages;
create policy "participant_can_read_own_messages" on public.messages for select to authenticated
using (public.message_account_active() and exists (
  select 1 from public.message_threads mt
  join public.enrollments e on e.id = mt.enrollment_id
  where mt.id = messages.thread_id and e.participant_id = auth.uid()
));

drop policy if exists "assigned_coach_can_read_threads" on public.message_threads;
create policy "assigned_coach_can_read_threads" on public.message_threads for select to authenticated
using (public.message_account_active() and assigned_coach_id = auth.uid());

drop policy if exists "assigned_coach_can_read_messages" on public.messages;
create policy "assigned_coach_can_read_messages" on public.messages for select to authenticated
using (public.message_account_active() and exists (
  select 1 from public.message_threads mt
  where mt.id = messages.thread_id and mt.assigned_coach_id = auth.uid()
));
