import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthRepository, ConsentChoice } from './domain';
import privacyUrl from '../../Munks-Werkt-privacyverklaring.html?url';
import consentUrl from '../../Munks-Werkt-toestemming-concept.html?url';

type AuthScreen = 'activate' | 'privacy' | 'ai-consent' | 'biometric' | 'ready' | 'login';
type PendingActivation = { sessionId: string; email: string; password: string };

const Progress = ({ step }: { step: number }) => <div className="auth-progress" aria-label={`Stap ${step} van 4`}>{[1,2,3,4].map(item => <span className={item <= step ? 'active' : ''} key={item}/>)}</div>;

export function AuthFlow({ repository, onAuthenticated }: { repository: AuthRepository; onAuthenticated: () => void }) {
  const [screen, setScreen] = useState<AuthScreen>('activate');
  const [pending, setPending] = useState<PendingActivation>();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (task: () => Promise<void>) => { setError(''); setBusy(true); try { await task(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Er ging iets mis. Probeer het opnieuw.'); } finally { setBusy(false); } };

  const activate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get('email') ?? '').trim();
    const code = String(fields.get('code') ?? '').trim();
    const password = String(fields.get('password') ?? '');
    const repeat = String(fields.get('repeat') ?? '');
    if (password.length < 8) return setError('Gebruik een wachtwoord van minimaal 8 tekens.');
    if (password !== repeat) return setError('De wachtwoorden zijn niet hetzelfde.');
    void run(async () => { const result = await repository.beginActivation(email, code); setPending({ sessionId: result.activationSessionId, email, password }); setScreen('privacy'); });
  };

  const finishConsent = () => {
    if (aiEnabled === undefined) return setError('Kies of je de AI-assistent wilt gebruiken.');
    const choice: ConsentChoice = { privacyVersion: 'concept-2026-08', consentVersion: 'concept-2026-08', privacyAccepted, consentAccepted, aiAssistantEnabled: aiEnabled };
    void run(async () => { if (!pending) throw new Error('Je activatiesessie is verlopen. Begin opnieuw.'); await repository.completeActivation(pending.sessionId, pending.password, choice); setPending(current => current ? { ...current, password: '' } : current); setScreen('biometric'); });
  };

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const fields = new FormData(event.currentTarget);
    void run(async () => { await repository.signIn(String(fields.get('email') ?? ''), String(fields.get('password') ?? '')); onAuthenticated(); });
  };

  return <section className="auth-screen">
    {screen === 'activate' && <><Progress step={1}/><span className="eyebrow">Eerste keer</span><h1>Activeer je account</h1><p>Je krijgt de activatiecode van je begeleider. Daarna kies je zelf een wachtwoord.</p><form className="form-card" onSubmit={activate}><label>E-mailadres<input name="email" type="email" autoComplete="email" required placeholder="jij@voorbeeld.nl"/></label><label>Activatiecode<input name="code" inputMode="numeric" pattern="[0-9]{6,8}" required placeholder="Bijvoorbeeld 482913"/></label><label>Kies een wachtwoord<input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="Minimaal 8 tekens"/></label><label>Herhaal je wachtwoord<input name="repeat" type="password" autoComplete="new-password" minLength={8} required/></label><button className="auth-primary" disabled={busy}>{busy?'Gegevens controleren…':'Verder naar privacy'}</button></form><button className="auth-secondary" onClick={() => setScreen('login')}>Ik heb al een account</button></>}

    {screen === 'privacy' && <><Progress step={2}/><span className="eyebrow">Jouw gegevens</span><h1>Jouw privacy</h1><p>We gebruiken alleen gegevens die nodig zijn voor jouw traject. Hier lees je in het kort wat dat betekent.</p><div className="form-card"><h2>Wie ziet jouw gegevens?</h2><p>Je antwoorden zijn alleen zichtbaar voor jou en de bevoegde begeleiders binnen jouw traject. De RSD ziet alleen de afgesproken voortgangs- en resultaatgegevens.</p><h2>AI-assistent en talententest</h2><p>AI kan fouten maken en neemt geen beslissingen over jou. Je begeleiders bespreken de uitslag van de talententest met je en blijven verantwoordelijk voor het uiteindelijke advies.</p><a className="document-link" href={privacyUrl} target="_blank" rel="noreferrer">Open de privacyverklaring</a><label className="check"><input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)}/><span>Ik heb de privacyverklaring gelezen en ga hiermee akkoord.</span></label><a className="document-link" href={consentUrl} target="_blank" rel="noreferrer">Open het toestemmingsformulier</a><label className="check"><input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}/><span>Ik heb het toestemmingsformulier gelezen en ga hiermee akkoord.</span></label></div><button className="auth-primary" disabled={!privacyAccepted||!consentAccepted} onClick={() => {setError('');setScreen('ai-consent')}}>Verder naar toestemming</button><button className="auth-secondary" onClick={() => setScreen('activate')}>Terug</button></>}

    {screen === 'ai-consent' && <><Progress step={2}/><span className="eyebrow">Jouw keuze</span><h1>De AI-assistent</h1><p>Je bepaalt zelf of je de AI-assistent wilt gebruiken. Je keuze heeft geen gevolgen voor je deelname.</p><div className="form-card"><h2>Waarmee kan de AI-assistent helpen?</h2><p>Met vragen over werk of opleiding, je cv, het voorbereiden van een gesprek en jouw volgende stap.</p><h2>Goed om te weten</h2><ul><li>Je praat met AI en niet met een echte begeleider.</li><li>Vragen buiten het traject worden niet beantwoord.</li><li>Gesprekken zijn niet automatisch zichtbaar voor begeleiders of de RSD.</li><li>Deel geen BSN, wachtwoorden of identiteitsbewijs.</li></ul><fieldset><legend>Wil je de AI-assistent gebruiken?</legend><label className="check"><input type="radio" name="ai" checked={aiEnabled===true} onChange={() => setAiEnabled(true)}/><span>Ja, ik wil de AI-assistent gebruiken.</span></label><label className="check"><input type="radio" name="ai" checked={aiEnabled===false} onChange={() => setAiEnabled(false)}/><span>Nee, nu niet.</span></label></fieldset></div><button className="auth-primary" disabled={busy||aiEnabled===undefined} onClick={finishConsent}>{busy?'Account activeren…':'Account activeren'}</button><button className="auth-secondary" onClick={() => setScreen('privacy')}>Terug</button></>}

    {screen === 'biometric' && <><Progress step={3}/><span className="eyebrow">Sneller inloggen</span><h1>Biometrisch inloggen instellen</h1><p>Gebruik Face ID, Touch ID of de vingerafdruk van je telefoon. Munks Werkt ontvangt je gezicht of vingerafdruk niet.</p><div className="form-card biometric"><strong aria-hidden="true">ID</strong><p>Je telefoon controleert alleen dat jij het bent. Je wachtwoord blijft beschikbaar als alternatief.</p></div><button className="auth-primary" disabled={busy} onClick={() => void run(async()=>{await repository.registerBiometric();setScreen('ready')})}>Biometrisch inloggen instellen</button><button className="auth-secondary" onClick={() => setScreen('ready')}>Nu niet</button></>}

    {screen === 'ready' && <><Progress step={4}/><span className="eyebrow">Gelukt</span><h1>Je account is klaar</h1><p>Je kunt nu veilig verder naar Munks Werkt.</p><button className="auth-primary" onClick={onAuthenticated}>Naar Home</button><div className="auth-note">Deze bouwversie gebruikt alleen fictieve gegevens. De echte accountkoppeling volgt via beveiligde serverfuncties.</div></>}

    {screen === 'login' && <><span className="eyebrow">Welkom terug</span><h1>Inloggen</h1><p>Log in met biometrie of gebruik je e-mailadres en wachtwoord.</p><button className="auth-primary" onClick={onAuthenticated}>Inloggen met biometrie</button><div className="divider">of</div><form className="form-card" onSubmit={login}><label>E-mailadres<input name="email" type="email" autoComplete="email" required/></label><label>Wachtwoord<input name="password" type="password" autoComplete="current-password" minLength={8} required/></label><button className="auth-primary" disabled={busy}>{busy?'Inloggen…':'Inloggen'}</button></form><button className="auth-secondary" onClick={() => setScreen('activate')}>Eerste keer? Activeer je account</button></>}
    {error && <p className="auth-error" role="alert">{error}</p>}
  </section>;
}
