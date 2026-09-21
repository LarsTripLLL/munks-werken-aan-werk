import { useEffect, useState } from 'react';
import type { TalentTestRepository, TalentTestStatus } from './domain';

type Stage = 'intro' | 'waiting' | 'released';
const Eye = () => <svg className="eye-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.75"/></svg>;

export function StepTwoFlow({ repository, participantId, trajectoryCode, onClose, onViewReport }: { repository: TalentTestRepository; participantId: string; trajectoryCode: string; onClose: () => void; onViewReport: () => void; onComplete: () => Promise<void> }) {
  const [stage, setStage] = useState<Stage>('intro');
  const [choice, setChoice] = useState<'accepted'>();
  const [status, setStatus] = useState<TalentTestStatus>('not_started');
  const [message, setMessage] = useState('');
  const testUrl = import.meta.env.VITE_TALENT_TEST_URL || 'https://www.dilemmamanager.nl/assessment/Start?code=Edu2394Mk';

  useEffect(() => { repository.getStatus(participantId, trajectoryCode).then(current => { setStatus(current); setStage(current === 'released' ? 'released' : current === 'completed' ? 'waiting' : 'intro'); }); }, [participantId, repository, trajectoryCode]);

  const openTest = async () => {
    setMessage('');
    if (!choice) return setMessage('Geef eerst akkoord om de talententest te openen.');

    // Open direct on the click, before the async save, so mobile browsers do not block the tab.
    const testWindow = window.open('about:blank', '_blank');
    if (!testWindow) return setMessage('Het nieuwe tabblad is geblokkeerd. Sta pop-ups toe voor Munks Werkt en probeer het opnieuw.');
    testWindow.opener = null;
    try {
      await repository.recordConsent(participantId, trajectoryCode, choice);
      testWindow.location.replace(testUrl);
    } catch {
      testWindow.close();
      setMessage('Je keuze kon niet worden opgeslagen. Probeer het opnieuw.');
    }
  };

  if (stage === 'waiting') return <section className="step-flow"><span className="eyebrow">Stap 2 · Ontdek je talenten</span><h1>Mooi, deze stap is klaar</h1><p>Je hebt de talententest afgerond.</p><section className="flow-card"><h2>Eerst samen bespreken</h2><p>Binnen deze stap bekijk je samen met je begeleider wat de uitkomsten over jou vertellen.</p><div className="notice-box">Je bespreekt de uitkomsten rustig met je begeleider. Daarna kan je begeleider het rapport voor je vrijgeven.</div></section><button className="flow-primary orange" onClick={onClose}>Bekijk mijn route</button>{message && <p className="flow-error" role="alert">{message}</p>}</section>;

  if (stage === 'released') return <section className="step-flow"><span className="eyebrow">Stap 2 · Ontdek je talenten</span><h1>Jouw uitkomsten zijn beschikbaar</h1><p>Je hebt de uitkomsten samen met je begeleider besproken. Je kunt ze nu rustig terugkijken.</p><section className="flow-card"><h2>Jouw persoonlijke uitkomsten</h2><p>Je begeleider heeft het rapport van de talententest voor je vrijgegeven. Je vindt het bij Mijn documenten.</p><div className="visibility-note"><Eye/><span>Alleen jij en de bevoegde begeleiders kunnen het rapport bekijken.</span></div></section><button className="flow-primary" onClick={onViewReport}>Bekijk mijn rapport</button><button className="flow-secondary" onClick={onClose}>Terug naar mijn route</button></section>;

  return <section className="step-flow"><span className="eyebrow">Stap 2 · Ontdek je talenten</span><h1>Jouw talententest</h1><p>Met deze talententest ontdek je wat bij je past. Er zijn geen goede of foute antwoorden.</p><section className="flow-card"><div className="test-meta"><span>Talententest</span><span>Ongeveer 60 minuten</span></div><ol className="numbered-info"><li>Kies steeds het antwoord dat het beste bij jou past.</li><li>Neem rustig de tijd en kies wat voor jou goed voelt.</li><li>Je begeleiders bespreken de uitkomsten eerst met je. Daarna krijg je de uitkomsten te zien.</li><li>De uitslag is geen automatisch oordeel en bepaalt niet zelfstandig jouw advies.</li></ol><fieldset className="consent-field"><legend>Wil je de talententest doen?</legend><p>Je begeleiders kunnen de uitkomsten zien om ze met jou te bespreken. De RSD krijgt niet automatisch je volledige test of ruwe antwoorden.</p><p>Je begeleider bespreekt de resultaten met je in een individueel gesprek.</p><div className="notice-box">De test duurt 60 minuten, we raden je aan deze in één keer af te maken.</div><label className="check"><input type="radio" name="talent-consent" checked={choice === 'accepted'} onChange={() => setChoice('accepted')}/><span>Ik begrijp de uitleg en ga akkoord.</span></label></fieldset></section><button className="flow-primary" onClick={() => void openTest()}>Open de talententest</button><p className="external-note">De talententest opent in een nieuw tabblad op de website van DilemmaManager. Munks Werkt blijft open.</p><button className="flow-secondary" onClick={onClose}>Terug naar mijn route</button>{message && <p className="flow-error" role="alert">{message}</p>}<span className="sr-only">Huidige teststatus: {status}</span></section>;
}
