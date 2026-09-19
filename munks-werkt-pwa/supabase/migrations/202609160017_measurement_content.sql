-- Begin- en eindmeting beschikbaar maken voor deelnemer, begeleiders en opdrachtgever.

with program as (
  select id from public.programs where name = 'Munks Werkt'
), measurement_content(step_number, content_key, title, sort_order) as (
  values
    (1, 's1-measurement', 'Jouw beginmeting', 9),
    (7, 's7-measurement', 'Jouw eindmeting', 4)
)
insert into public.step_content (
  step_id, content_key, kind, title, sort_order, answer_visibility, skippable
)
select
  steps.id,
  measurement_content.content_key,
  'question'::public.content_kind,
  measurement_content.title,
  measurement_content.sort_order,
  'participant_coaches_and_project_leader'::public.answer_visibility,
  false
from measurement_content
join public.steps on steps.step_number = measurement_content.step_number
join program on program.id = steps.program_id
on conflict (step_id, content_key) do update set
  title = excluded.title,
  answer_visibility = excluded.answer_visibility,
  skippable = false,
  active = true,
  updated_at = now();

