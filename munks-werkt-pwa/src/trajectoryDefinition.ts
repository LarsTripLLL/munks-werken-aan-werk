import type { TrajectoryDefinition } from './domain';

const privateAnswer = ['participant', 'coach'] as const;
const measurement = ['participant', 'coach', 'commissioner'] as const;

export const munksWerktTrajectory: TrajectoryDefinition = {
  code: 'munks-werkt-v1',
  title: 'Munks Werkt',
  steps: [
    {
      number: 1,
      title: 'Kennismaken',
      hasGroupMeeting: true,
      activities: [
        { id: 's1-intro', kind: 'introduction', title: 'Over jezelf en voor jezelf', explanation: 'Met deze vragen bereid je je rustig voor op de kennismaking met de groep.', estimatedMinutes: 5, audiences: [...privateAnswer] },
        { id: 's1-name', kind: 'text', title: 'Hoe wil je dat we jou noemen?', skippable: true, audiences: [...privateAnswer] },
        { id: 's1-enjoy', kind: 'text', title: 'Wat vind je leuk om te doen?', skippable: true, audiences: [...privateAnswer] },
        { id: 's1-strengths', kind: 'text', title: 'Waar ben je goed in?', skippable: true, audiences: [...privateAnswer] },
        { id: 's1-ideal-work', kind: 'text', title: 'Als alles mogelijk is, wat voor werk zou je dan het liefst doen?', skippable: true, audiences: [...privateAnswer] },
        { id: 's1-expectation', kind: 'text', title: 'Wat hoop je uit Munks Werkt te halen?', skippable: true, audiences: [...privateAnswer] },
        { id: 's1-group', kind: 'text', title: 'Wat helpt jou om je prettig te voelen in een groep?', skippable: true, audiences: [...privateAnswer] },
        { id: 's1-measurement', kind: 'measurement', title: 'Waar sta je nu?', audiences: [...measurement] },
        { id: 's1-support', kind: 'text', title: 'Is er iets wat je begeleiders vooraf moeten weten?', skippable: true, audiences: [...privateAnswer] },
      ],
    },
    {
      number: 2,
      title: 'Ontdek je talenten',
      hasGroupMeeting: true,
      activities: [
        { id: 's2-intro', kind: 'introduction', title: 'Jouw talententest', estimatedMinutes: 60, audiences: ['participant', 'coach'] },
        { id: 's2-consent', kind: 'choice', title: 'Wil je de talententest doen?', audiences: ['participant', 'coach'] },
        { id: 's2-external-test', kind: 'external', title: 'Open de talententest', audiences: ['participant', 'coach'] },
        { id: 's2-discussion', kind: 'meeting', title: 'Eerst samen bespreken', audiences: ['participant', 'coach'] },
        { id: 's2-results', kind: 'result', title: 'Jouw uitkomsten zijn beschikbaar', audiences: ['participant', 'coach'] },
      ],
    },
    {
      number: 3,
      title: 'Maak je cv',
      hasGroupMeeting: false,
      activities: [
        { id: 's3-details', kind: 'text', title: 'Jouw gegevens', audiences: [...privateAnswer] },
        { id: 's3-about', kind: 'text', title: 'Dit ben ik', audiences: [...privateAnswer] },
        { id: 's3-education', kind: 'text', title: 'Opleiding en leren', skippable: true, audiences: [...privateAnswer] },
        { id: 's3-experience', kind: 'text', title: 'Mijn ervaring', skippable: true, audiences: [...privateAnswer] },
        { id: 's3-extra', kind: 'text', title: 'Extra informatie', skippable: true, audiences: [...privateAnswer] },
        { id: 's3-review', kind: 'review', title: 'Bekijk jouw cv', audiences: [...privateAnswer] },
      ],
    },
    {
      number: 4,
      title: 'Bespreek je cv',
      hasGroupMeeting: true,
      activities: [{ id: 's4-group-review', kind: 'meeting', title: 'Samen naar je cv kijken', audiences: ['participant', 'coach'] }],
    },
    {
      number: 5,
      title: 'Werk zoeken en reageren',
      hasGroupMeeting: false,
      activities: [
        { id: 's5-sources', kind: 'choice', title: 'Waar kun je werk vinden?', audiences: [...privateAnswer] },
        { id: 's5-fit', kind: 'choice', title: 'Wat past bij jou?', audiences: [...privateAnswer] },
        { id: 's5-example', kind: 'review', title: 'Een baan bekijken', audiences: ['participant'] },
        { id: 's5-match', kind: 'choice', title: 'Past deze baan bij mij?', audiences: [...privateAnswer] },
        { id: 's5-reaction-example', kind: 'review', title: 'Hoe kun je reageren?', audiences: ['participant'] },
        { id: 's5-reaction', kind: 'text', title: 'Jouw reactie voorbereiden', audiences: [...privateAnswer] },
      ],
    },
    {
      number: 6,
      title: 'Bereid een gesprek voor',
      hasGroupMeeting: true,
      activities: [
        { id: 's6-questions', kind: 'review', title: 'Welke vragen kun je krijgen?', audiences: ['participant'] },
        { id: 's6-about', kind: 'text', title: 'Vertel iets over jezelf', audiences: [...privateAnswer] },
        { id: 's6-fit', kind: 'text', title: 'Waarom past dit werk bij jou?', audiences: [...privateAnswer] },
        { id: 's6-difficult', kind: 'text', title: 'Een lastig moment bespreken', audiences: [...privateAnswer] },
        { id: 's6-own-questions', kind: 'text', title: 'Welke vragen wil jij stellen?', audiences: [...privateAnswer] },
      ],
    },
    {
      number: 7,
      title: 'Bekijk je mogelijkheden',
      hasGroupMeeting: true,
      activities: [
        { id: 's7-direction', kind: 'choice', title: 'Welke richting wil je bespreken?', audiences: [...privateAnswer] },
        { id: 's7-prepare', kind: 'text', title: 'Bereid je gesprek voor', audiences: [...privateAnswer] },
        { id: 's7-measurement', kind: 'measurement', title: 'Waar sta je nu?', audiences: [...measurement] },
        { id: 's7-result', kind: 'result', title: 'Dit is jouw volgende stap', audiences: ['participant', 'coach', 'commissioner'] },
      ],
    },
  ],
};

export const measurementSubjects = [
  'Vertrouwen in de ondersteuning en dienstverlening',
  'Vertrouwen in jezelf',
  'Motivatie',
  'Inzicht in jouw toekomst',
  'Werknemersvaardigheden',
] as const;
