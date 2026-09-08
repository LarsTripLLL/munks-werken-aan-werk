-- Munks Werkt - begrensde inboxoverzichten voor deelnemer en begeleider

create or replace function public.list_my_message_threads()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(thread_json order by updated_at desc), '[]'::jsonb)
  from (
    select
      mt.updated_at,
      jsonb_build_object(
        'id', mt.id,
        'kind', mt.kind,
        'subject', mt.subject,
        'status', mt.status,
        'coachName', coalesce(nullif(concat_ws(' ', coach.first_name, coach.last_name), ''), 'Je begeleider'),
        'updatedAt', mt.updated_at,
        'unread', (select count(*) from public.messages unread where unread.thread_id = mt.id and unread.sender_id <> auth.uid() and unread.read_by_participant_at is null),
        'messages', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', m.id,
            'sender', case when m.sender_id = auth.uid() then 'participant' else 'coach' end,
            'senderName', case when m.sender_id = auth.uid() then 'Jij' else coalesce(nullif(concat_ws(' ', sender.first_name, sender.last_name), ''), 'Je begeleider') end,
            'body', m.body,
            'sentAt', m.created_at,
            'read', case when m.sender_id = auth.uid() then true else m.read_by_participant_at is not null end
          ) order by m.created_at)
          from public.messages m
          left join public.profiles sender on sender.id = m.sender_id
          where m.thread_id = mt.id
        ), '[]'::jsonb)
      ) as thread_json
    from public.message_threads mt
    join public.enrollments e on e.id = mt.enrollment_id
    left join public.profiles coach on coach.id = mt.assigned_coach_id
    where auth.uid() is not null and e.participant_id = auth.uid()
  ) own_threads;
$$;

create or replace function public.list_my_assigned_threads(p_trajectory_code text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(thread_json order by updated_at desc), '[]'::jsonb)
  from (
    select
      mt.updated_at,
      jsonb_build_object(
        'id', mt.id,
        'kind', mt.kind,
        'subject', mt.subject,
        'status', mt.status,
        'coachName', coalesce(nullif(concat_ws(' ', coach.first_name, coach.last_name), ''), 'Begeleider'),
        'participantId', participant.id,
        'participantName', concat_ws(' ', participant.first_name, participant.last_name),
        'trajectoryCode', tr.code,
        'updatedAt', mt.updated_at,
        'unread', (select count(*) from public.messages unread where unread.thread_id = mt.id and unread.sender_id <> auth.uid() and unread.read_by_coach_at is null),
        'messages', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', m.id,
            'sender', case when m.sender_id = auth.uid() then 'coach' else 'participant' end,
            'senderName', case when m.sender_id = auth.uid() then 'Jij' else concat_ws(' ', participant.first_name, participant.last_name) end,
            'body', m.body,
            'sentAt', m.created_at,
            'read', case when m.sender_id = auth.uid() then true else m.read_by_coach_at is not null end
          ) order by m.created_at)
          from public.messages m
          where m.thread_id = mt.id
        ), '[]'::jsonb)
      ) as thread_json
    from public.message_threads mt
    join public.enrollments e on e.id = mt.enrollment_id
    join public.trajectory_runs tr on tr.id = e.trajectory_run_id
    join public.profiles participant on participant.id = e.participant_id
    left join public.profiles coach on coach.id = mt.assigned_coach_id
    where auth.uid() is not null
      and mt.assigned_coach_id = auth.uid()
      and tr.code = p_trajectory_code
  ) assigned_threads;
$$;

revoke all on function public.list_my_message_threads() from public, anon;
revoke all on function public.list_my_assigned_threads(text) from public, anon;
grant execute on function public.list_my_message_threads() to authenticated;
grant execute on function public.list_my_assigned_threads(text) to authenticated;

