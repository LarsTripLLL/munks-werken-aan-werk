-- Aanvullende vragen die na de eerste pilotinhoud aan de PWA zijn toegevoegd.

with program as (
  select id from public.programs where name = 'Munks Werkt'
), content(step_number, content_key, title, sort_order) as (
  values
    (5, 's5-route',              'Wat wil je onderzoeken?',                    7),
    (5, 's5-education-sources',  'Waar kun je een opleiding vinden?',          8),
    (5, 's5-education-fit',      'Wat past bij jou bij een opleiding?',         9),
    (5, 's5-education-interest', 'Welke opleiding wil je onderzoeken?',        10),
    (7, 's7-measurement',        'Jouw eindmeting',                             4)
)
insert into public.step_content (
  step_id, content_key, kind, title, sort_order, answer_visibility, skippable
)
select
  steps.id,
  content.content_key,
  'question'::public.content_kind,
  content.title,
  content.sort_order,
  'participant_and_coaches'::public.answer_visibility,
  false
from content
join public.steps on public.steps.step_number = content.step_number
join program on program.id = public.steps.program_id
on conflict (step_id, content_key) do update set
  title = excluded.title,
  sort_order = excluded.sort_order,
  answer_visibility = excluded.answer_visibility,
  active = true,
  updated_at = now();
