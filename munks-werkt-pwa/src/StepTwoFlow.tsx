import { useEffect, useState } from 'react';
import type { TalentTestRepository, TalentTestStatus } from './domain';

type Stage = 'intro' | 'waiting' | 'released';
const Eye = () => <svg className="eye-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.75"/></svg>;

export function StepTwoFlow({ repository, participantId, trajectoryCode, onClose }: { repository: TalentTestRepository; participantId: string; trajectoryCode: string; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('intro');
  const [choice, setChoice] = useState<'accepted' | 'discuss'>();
  const [status, setStatus] = useState<TalentTestStatus>('not_started');
  const [message, setMessage] = useState('');
  const testUrl = import.meta.env.VITE_TALENT_TEST_URL;

  useEffect(() => { repository.getStatus(participantId, trajectoryCode).then(current => { setStatus(current); setStage(current === 'released' ? 'released' : current === 'completed' ? 'waiting' : 'intro'); }); }, [participantId, repository, trajectoryCode]);

  const openTest = async () => {
    setMessage('');
    if (!choice) return setMessage('Kies eerst of je akkoord gaat of dit wilt bespreken.');
    await repository.recordConsent(participantId, trajectoryCode, choice);
    if (choice === 'discuss') return setMessage('Bespreek dit eerst met je begeleider. De test wordt nog niet geopend.');
    if (!testUrl) return setMessage('De persoonlijke link naar de talententest wordt bij de technische koppeling toegevoegd.');
    window.open(testUrl, '_blank', 'noopener,noreferrer');
  };

  const demoComplete = async () => {
    setMessage('');
    try { await repository.recordConsent(participantId, trajectoryCode, 'accepted'); await repository.markCompleted(participantId, trajectoryCode); setStatus('completed'); setStage('waiting'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Opslaan is niet gelukt.'); }
  };
  const demoRelease = async () => {
    setMessage('');
    try { await repository.releaseResults(participantId, trajectoryCode); setStatus('released'); setStage('released'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Vrijgeven is niet gelukt.'); }
  };

  if (stage === 'waiting') return <section className="step-flow"><span className="eyebrow">Stap 2 · Ontdek je talenten</span><h1>Mooi, deze stap is klaar</h1><p>Je hebt de talententest afgerond.</p><section className="flow-card"><h2>Eerst samen bespreken</h2><p>Binnen deze stap bekijk je samen met je begeleider wat de uitkomsten over jou vertellen.</p><div className="notice-box">Je bespreekt de uitkomsten rustig met je begeleider. Daarna zijn de uitkomsten voor je beschikbaar.</div></section><button className="flow-primary orange" onClick={onClose}>Bekijk mijn route</button><button className="flow-secondary demo-action" onClick={() => void demoRelease()}>Demonstratie: gesprek is geweest</button>{message && <p className="flow-error" role="alert">{message}</p>}</section>;

  if (stage === 'released') return <section className="step-flow"><span className="eyebrow">Stap 2 · Ontdek je talenten</span><h1>Jouw uitkomsten zijn beschikbaar</h1><p>Je hebt de uitkomsten samen met je begeleider besproken. Je kunt ze nu rustig terugkijken.</p><section className="flow-card"><h2>Jouw persoonlijke uitkomsten</h2><p>De talententest en het gesprek horen samen bij stap 2.</p><div className="result-list"><article><strong>Praktisch ingesteld</strong><span>Je leert graag door iets te doen.</span></article><article><strong>Goed samenwerken</strong><span>Je luistert en helpt graag mee.</span></article><article><strong>Contact met anderen</strong><span>Werk met mensen kan goed bij je passen.</span></article></div><div className="visibility-note"><Eye/><span>Alleen jij en de begeleiders kunnen deze uitkomsten zien.</span></div></section><button className="flow-primary">Bekijk mijn uitkomsten</button><button className="flow-secondary" onClick={onClose}>Terug naar mijn route</button></section>;

  return <section className="step-flow"><span className="eyebrow">Stap 2 · Ontdek je talenten</span><h1>Jouw talententest</h1><p>Met deze talententest ontdek je wat bij je past. Er zijn geen goede of foute antwoorden.</p><section className="flow-card"><div className="test-meta"><span>Talententest</span><span>Ongeveer 60 minuten</span></div><ol className="numbered-info"><li>Kies steeds het antwoord dat het beste bij jou past.</li><li>Neem rustig de tijd en kies wat voor jou goed voelt.</li><li>Je begeleiders bespreken de uitkomsten eerst met je. Daarna krijg je de uitkomsten te zien.</li><li>De uitslag is geen automatisch oordeel en bepaalt niet zelfstandig jouw advies.</li></ol><fieldset className="consent-field"><legend>Wil je de talententest doen?</legend><p>Je begeleiders kunnen de uitkomsten zien om ze met jou te bespreken. De RSD krijgt niet automatisch je volledige test of ruwe antwoorden.</p><p>Je begeleider bespreekt de resultaten met je in een individueel gesprek.</p><label className="check"><input type="radio" name="talent-consent" checked={choice === 'accepted'} onChange={() => setChoice('accepted')}/><span>Ik begrijp de uitleg en ga akkoord.</span></label><label className="check"><input type="radio" name="talent-consent" checked={choice === 'discuss'} onChange={() => setChoice('discuss')}/><span>Ik wil dit eerst bespreken met mijn begeleider.</span></label></fieldset></section><button className="flow-primary" onClick={() => void openTest()}>Open de talententest</button><p className="external-note">De talententest opent in een nieuw venster. Als je klaar bent, sluit je de talententest en open je Munks Werkt opnieuw.</p><button className="flow-secondary demo-action" onClick={() => void demoComplete()}>Demonstratie: test is afgerond</button><button className="flow-secondary" onClick={onClose}>Terug naar mijn route</button>{message && <p className="flow-error" role="alert">{message}</p>}<span className="sr-only">Huidige teststatus: {status}</span></section>;
}
