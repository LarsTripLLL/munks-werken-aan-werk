import { useEffect, useMemo, useState } from 'react';
import type { AnswerRepository, ParticipantAnswer, TrajectoryActivity } from './domain';
import { measurementSubjects, munksWerktTrajectory } from './trajectoryDefinition';

type Stage = 'intro' | 'questions' | 'done';
type ScoreAnswer = Record<string, number>;

const help: Record<string, string> = {
  's1-name': 'Vul de naam in waarmee je tijdens het traject wilt worden aangesproken.',
  's1-enjoy': 'Denk aan dingen waar je graag tijd aan besteedt. Bijvoorbeeld muziek, sport, gamen, creatief bezig zijn of afspreken met anderen.',
  's1-strengths': 'Denk aan wat je zelf merkt en aan wat anderen weleens over jou zeggen.',
  's1-ideal-work': 'Je hoeft nog niet te weten of dit haalbaar is. Denk aan wat je doet, waar je werkt en met wie je werkt.',
  's1-expectation': 'Bijvoorbeeld ontdekken wat bij je past, een opleiding vinden, werk zoeken en een baan vinden of verdere begeleiding.',
  's1-group': 'Bijvoorbeeld rustig beginnen, duidelijke uitleg krijgen of eerst even luisteren.',
  's1-support': 'Je kunt hier iets delen dat helpt om jou goed te begeleiden. Je hoeft niets in te vullen als je dat niet wilt.',
};

function EyeIcon() {
  return <svg className="eye-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.75"/></svg>;
}

function VisibilityNote({ activity }: { activity: TrajectoryActivity }) {
  const commissioner = activity.audiences.includes('commissioner');
  return <div className="visibility-note"><EyeIcon/><span>{commissioner ? 'Jij, je begeleiders en de RSD kunnen deze antwoorden zien.' : 'Alleen jij en de begeleiders kunnen dit antwoord zien.'}</span></div>;
}

export function StepOneFlow({ repository, participantId, trajectoryCode, onClose }: {
  repository: AnswerRepository;
  participantId: string;
  trajectoryCode: string;
  onClose: () => void;
}) {
  const step = munksWerktTrajectory.steps[0];
  const questions = useMemo(() => step.activities.filter(activity => activity.kind !== 'introduction'), [step.activities]);
  const [stage, setStage] = useState<Stage>('intro');
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<string | ScoreAnswer>('');
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const activity = questions[index];

  useEffect(() => {
    if (stage !== 'questions') return;
    let active = true;
    setLoaded(false);
    repository.get(participantId, trajectoryCode, activity.id).then(answer => {
      if (!active) return;
      const stored = answer?.value;
      setValue(activity.kind === 'measurement'
        ? (stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {})
        : (typeof stored === 'string' ? stored : ''));
      setSaveState(answer ? 'saved' : 'idle');
      setLoaded(true);
    });
    return () => { active = false; };
  }, [activity.id, activity.kind, participantId, repository, stage, trajectoryCode]);

  useEffect(() => {
    if (!loaded || stage !== 'questions' || activity.kind === 'measurement') return;
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      const answer: ParticipantAnswer = { participantId, trajectoryCode, activityId: activity.id, value, updatedAt: new Date().toISOString() };
      repository.save(answer).then(() => setSaveState('saved')).catch(() => setSaveState('error'));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [activity.id, activity.kind, loaded, participantId, repository, stage, trajectoryCode, value]);

  const saveScores = (subject: string, score: number) => {
    const next = { ...(typeof value === 'object' && !Array.isArray(value) ? value : {}), [subject]: score };
    setValue(next);
    setSaveState('saving');
    repository.save({ participantId, trajectoryCode, activityId: activity.id, value: next, updatedAt: new Date().toISOString() })
      .then(() => setSaveState('saved')).catch(() => setSaveState('error'));
  };

  const next = () => {
    if (index === questions.length - 1) setStage('done');
    else setIndex(current => current + 1);
  };

  const saveTextNow = async (nextValue = value) => {
    if (activity.kind === 'measurement') return;
    setSaveState('saving');
    try {
      await repository.save({ participantId, trajectoryCode, activityId: activity.id, value: nextValue, updatedAt: new Date().toISOString() });
      setSaveState('saved');
    } catch {
      setSaveState('error');
      throw new Error('Opslaan is niet gelukt.');
    }
  };

  const continueAfterSave = async () => {
    try { await saveTextNow(); next(); } catch { /* De gebruiker blijft op het scherm. */ }
  };

  const skipAndContinue = async () => {
    try { await saveTextNow(''); setValue(''); next(); } catch { /* De gebruiker blijft op het scherm. */ }
  };

  if (stage === 'intro') return <section className="step-flow">
    <span className="eyebrow">Stap 1 · Kennismaken</span><h1>Over jezelf en voor jezelf</h1>
    <p>Met deze vragen bereid je je rustig voor op de kennismaking met de groep.</p>
    <section className="flow-card intro-list"><h2>Goed om te weten</h2><p>Je bent ongeveer 5 minuten bezig.</p><p>Iedere vraag staat op een apart scherm.</p><p className="with-eye"><EyeIcon/>Alleen jij en de begeleiders kunnen je antwoorden zien.</p><p>Er zijn geen goede of foute antwoorden.</p></section>
    <button className="flow-primary" onClick={() => setStage('questions')}>Begin met de vragen</button>
    <button className="flow-secondary" onClick={onClose}>Terug naar mijn route</button>
  </section>;

  if (stage === 'done') return <section className="step-flow">
    <span className="eyebrow">Stap 1 · Kennismaken</span><h1>Je bent voorbereid</h1>
    <p>Je antwoorden zijn automatisch opgeslagen. Je kunt ze tijdens de kennismaking gebruiken.</p>
    <section className="flow-card"><h2>Fijn dat je dit hebt gedaan</h2><p>Je hoeft je antwoorden niet met de groep te delen. Jij bepaalt wat je tijdens de kennismaking vertelt.</p></section>
    <button className="flow-primary orange" onClick={onClose}>Terug naar mijn route</button>
    <button className="flow-secondary" onClick={() => { setIndex(0); setStage('questions'); }}>Mijn antwoorden bekijken</button>
  </section>;

  const scores: ScoreAnswer = typeof value === 'object' && !Array.isArray(value) ? value : {};
  return <section className="step-flow">
    <span className="eyebrow">Stap 1 · Kennismaken</span>
    <h1>{activity.kind === 'measurement' ? 'Hoe gaat het nu met jou' : 'Over jezelf en voor jezelf'}</h1>
    <p>{activity.kind === 'measurement' ? 'Kies bij ieder onderwerp het cijfer dat het beste past.' : 'Neem rustig de tijd. Er zijn geen foute antwoorden.'}</p>
    <section className="flow-card question-card">
      <span className="question-count">{activity.kind === 'measurement' ? 'Waar sta je nu' : `Vraag ${index + 1} van ${questions.length}`}</span>
      <h2>{activity.kind === 'measurement' ? 'Kies een cijfer van 1 tot 10' : activity.title}</h2>
      {activity.kind === 'measurement' ? <><p>1 is helemaal niet en 10 is helemaal wel.</p><div className="measurement-list">{measurementSubjects.map(subject => <fieldset key={subject}><legend>{subject}</legend><div className="score-row">{[1,2,3,4,5,6,7,8,9,10].map(score => <label key={score}><input type="radio" name={subject} checked={scores[subject] === score} onChange={() => saveScores(subject, score)}/><span>{score}</span></label>)}</div></fieldset>)}</div></> : <><p>{help[activity.id]}</p><textarea value={typeof value === 'string' ? value : ''} onChange={event => setValue(event.target.value)} placeholder="Schrijf hier je antwoord…"/></>}
      <VisibilityNote activity={activity}/>
      <div className={`save-state ${saveState}`} aria-live="polite">{{idle:'Nog niet ingevuld',saving:'Opslaan…',saved:'Automatisch opgeslagen',error:'Opslaan is niet gelukt'}[saveState]}</div>
    </section>
    <button className="flow-primary" onClick={() => activity.kind === 'measurement' ? next() : void continueAfterSave()}>{index === questions.length - 1 ? 'Voorbereiding afronden' : 'Volgende vraag'}</button>
    {activity.skippable && <button className="flow-link" onClick={() => void skipAndContinue()}>Deze vraag overslaan</button>}
    <button className="flow-secondary" onClick={() => { if (activity.kind !== 'measurement') void saveTextNow(); index === 0 ? setStage('intro') : setIndex(current => current - 1); }}>{index === 0 ? 'Terug naar uitleg' : 'Vorige vraag'}</button>
  </section>;
}
