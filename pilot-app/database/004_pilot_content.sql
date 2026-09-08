-- Munks Werkt - vaste inhoud van de zeven pilotstappen
-- De content_key is gelijk aan het activity-id in de PWA.

with program as (
  select id from public.programs where name = 'Munks Werkt'
), content(step_number, content_key, kind, title, sort_order, visibility, skippable) as (
  values
    (1, 's1-intro',             'information', 'Over jezelf en voor jezelf',                                      1, null,                              true),
    (1, 's1-name',              'question',    'Hoe wil je dat we jou noemen?',                                   2, 'participant_and_coaches',         true),
    (1, 's1-enjoy',             'question',    'Wat vind je leuk om te doen?',                                    3, 'participant_and_coaches',         true),
    (1, 's1-strengths',         'question',    'Waar ben je goed in?',                                            4, 'participant_and_coaches',         true),
    (1, 's1-ideal-work',        'question',    'Als alles mogelijk is, wat voor werk zou je dan het liefst doen?', 5, 'participant_and_coaches',         true),
    (1, 's1-expectation',       'question',    'Wat hoop je uit Munks Werkt te halen?',                           6, 'participant_and_coaches',         true),
    (1, 's1-group',             'question',    'Wat helpt jou om je prettig te voelen in een groep?',             7, 'participant_and_coaches',         true),
    (1, 's1-support',           'question',    'Is er iets wat je begeleiders vooraf moeten weten?',              8, 'participant_and_coaches',         true),

    (2, 's2-intro',             'information', 'Jouw talententest',                                               1, null,                              true),
    (2, 's2-consent',           'question',    'Wil je de talententest doen?',                                    2, 'participant_and_coaches',        false),
    (2, 's2-external-test',     'information', 'Open de talententest',                                            3, null,                              true),
    (2, 's2-discussion',        'information', 'Eerst samen bespreken',                                           4, null,                              true),
    (2, 's2-results',           'information', 'Jouw uitkomsten zijn beschikbaar',                                5, null,                              true),

    (3, 's3-details',           'question',    'Jouw gegevens',                                                    1, 'participant_and_coaches',        false),
    (3, 's3-about',             'question',    'Dit ben ik',                                                       2, 'participant_and_coaches',        false),
    (3, 's3-education',         'question',    'Opleiding en leren',                                               3, 'participant_and_coaches',         true),
    (3, 's3-experience',        'question',    'Mijn ervaring',                                                    4, 'participant_and_coaches',         true),
    (3, 's3-extra',             'question',    'Extra informatie',                                                5, 'participant_and_coaches',         true),
    (3, 's3-review',            'information', 'Bekijk jouw cv',                                                  6, null,                              true),

    (4, 's4-group-review',      'information', 'Samen naar je cv kijken',                                         1, null,                              true),

    (5, 's5-sources',           'question',    'Waar kun je werk vinden?',                                        1, 'participant_and_coaches',        false),
    (5, 's5-fit',               'question',    'Wat past bij jou?',                                                2, 'participant_and_coaches',        false),
    (5, 's5-example',           'information', 'Een baan bekijken',                                               3, null,                              true),
    (5, 's5-match',             'question',    'Past deze baan bij mij?',                                         4, 'participant_and_coaches',        false),
    (5, 's5-reaction-example',  'information', 'Hoe kun je reageren?',                                            5, null,                              true),
    (5, 's5-reaction',          'question',    'Jouw reactie voorbereiden',                                       6, 'participant_and_coaches',        false),

    (6, 's6-questions',         'information', 'Welke vragen kun je krijgen?',                                    1, null,                              true),
    (6, 's6-about',             'question',    'Vertel iets over jezelf',                                         2, 'participant_and_coaches',        false),
    (6, 's6-fit',               'question',    'Waarom past dit werk bij jou?',                                   3, 'participant_and_coaches',        false),
    (6, 's6-difficult',         'question',    'Een lastig moment bespreken',                                     4, 'participant_and_coaches',        false),
    (6, 's6-own-questions',     'question',    'Welke vragen wil jij stellen?',                                   5, 'participant_and_coaches',        false),

    (7, 's7-direction',         'question',    'Welke richting wil je bespreken?',                                1, 'participant_and_coaches',        false),
    (7, 's7-prepare',           'question',    'Bereid je gesprek voor',                                          2, 'participant_and_coaches',        false),
    (7, 's7-result',            'information', 'Dit is jouw volgende stap',                                       3, null,                              true)
)
insert into public.step_content (
  step_id, content_key, kind, title, sort_order, answer_visibility, skippable
)
select
  s.id,
  content.content_key,
  content.kind::public.content_kind,
  content.title,
  content.sort_order,
  content.visibility::public.answer_visibility,
  content.skippable
from content
join public.steps s on s.step_number = content.step_number
join program on program.id = s.program_id
on conflict (step_id, content_key) do update set
  kind = excluded.kind,
  title = excluded.title,
  sort_order = excluded.sort_order,
  answer_visibility = excluded.answer_visibility,
  skippable = excluded.skippable,
  active = true,
  updated_at = now();

