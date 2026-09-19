-- Houd lopende hulpvragen bij de actuele eigen begeleider van de deelnemer.
create or replace function public.transfer_open_threads_to_primary_coach()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  with moved as (
    update public.message_threads mt
    set assigned_coach_id = new.primary_coach_id,
        status = 'open',
        handled_at = null,
        updated_at = now()
    where mt.enrollment_id = new.id
      and mt.status <> 'closed'
      and mt.assigned_coach_id is distinct from new.primary_coach_id
    returning mt.id
  )
  update public.messages m
  set read_by_coach_at = null
  from moved
  where m.thread_id = moved.id
    and m.sender_id = new.participant_id;

  return new;
end;
$function$;

create trigger transfer_open_threads_on_coach_change
after update of primary_coach_id on public.enrollments
for each row
when (old.primary_coach_id is distinct from new.primary_coach_id)
execute function public.transfer_open_threads_to_primary_coach();

-- Ook gesprekken herstellen van deelnemers die vóór deze wijziging zijn overgezet.
with moved as (
  update public.message_threads mt
  set assigned_coach_id = e.primary_coach_id,
      status = 'open',
      handled_at = null,
      updated_at = now()
  from public.enrollments e
  where mt.enrollment_id = e.id
    and mt.status <> 'closed'
    and mt.assigned_coach_id is distinct from e.primary_coach_id
  returning mt.id
)
update public.messages m
set read_by_coach_at = null
from moved
join public.message_threads mt on mt.id = moved.id
join public.enrollments e on e.id = mt.enrollment_id
where m.thread_id = moved.id
  and m.sender_id = e.participant_id;
