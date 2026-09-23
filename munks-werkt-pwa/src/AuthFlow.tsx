import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthenticationResult, AuthRepository, ConsentChoice, PendingMfaAuthentication, SessionUser } from './domain';
const privacySummaryUrl = '/documenten/Jouw%20privacy%20in%20Munks%20Werkt%20verkort.pdf';
const privacyFullUrl = '/documenten/Privacyverklaring%20Munks%20Werkt%20volledig.pdf';
const consentUrl = '/documenten/Toestemmingsverklaring%20Munks%20Werkt.pdf';

type AuthScreen = 'activate' | 'privacy' | 'privacy-document' | 'consent-document' | 'ai-consent' | 'ready' | 'login' | 'staff-invite' | 'reset-request' | 'reset-sent' | 'password-recovery' | 'mfa-enroll' | 'mfa-challenge';
type PendingActivation = { sessionId: string; email: string; password: string };

const Progress = ({ step }: { step: number }) => <div className="auth-progress" aria-label={`Stap ${step} van 3`}>{[1,2,3].map(item => <span className={item <= step ? 'active' : ''} key={item}/>)}</div>;

export function AuthFlow({ repository, initialMfa, onAuthenticated }: { repository: AuthRepository; initialMfa?: PendingMfaAuthentication; onAuthenticated: (user: SessionUser) => void }) {
  const directEmailSession=new URLSearchParams(location.hash.replace(/^#/,'')).has('access_token');
  const [screen, setScreen] = useState<AuthScreen>(()=>{
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(location.search);
    const type = hash.get('type') || query.get('type') || query.get('auth');
    return initialMfa?.status === 'mfa_enroll' ? 'mfa-enroll' : initialMfa?.status === 'mfa_challenge' ? 'mfa-challenge' : type === 'recovery' ? 'password-recovery' : type === 'invite' ? 'staff-invite' : 'login';
  });
  const [mfa, setMfa] = useState<PendingMfaAuthentication | undefined>(initialMfa);
  const [pending, setPending] = useState<PendingActivation>();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean>();
  const [error, setError] = useState(() => new URLSearchParams(location.hash.replace(/^#/, '')).has('error') ? 'Deze link is ongeldig of verlopen. Vraag een nieuwe resetmail aan.' : '');
  const [notice, setNotice] = useState('');
  const [recoveryEmail,setRecoveryEmail]=useState('');
  const [busy, setBusy] = useState(false);

  const run = async (task: () => Promise<void>) => { setError(''); setBusy(true); try { await task(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Er ging iets mis. Probeer het opnieuw.'); } finally { setBusy(false); } };
  const handleAuthentication = (result: AuthenticationResult) => {
    if (result.status === 'authenticated') return onAuthenticated(result.user);
    setMfa(result);
    setScreen(result.status === 'mfa_enroll' ? 'mfa-enroll' : 'mfa-challenge');
  };

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
    void run(async () => { if (!pending) throw new Error('Je activatiesessie is verlopen. Begin opnieuw.'); await repository.completeActivation(pending.sessionId, pending.password, choice); setPending(current => current ? { ...current, password: '' } : current); setScreen('ready'); });
  };

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const fields = new FormData(event.currentTarget);
    void run(async () => { handleAuthentication(await repository.signIn(String(fields.get('email') ?? ''), String(fields.get('password') ?? ''))); });
  };
  const verifyMfa = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('mfaCode') ?? '').replace(/\s/g, '');
    void run(async () => {
      if (!mfa || !repository.verifyMfa) throw new Error('De tweede beveiligingsstap is niet beschikbaar. Log opnieuw in.');
      onAuthenticated(await repository.verifyMfa(mfa.factorId, code));
    });
  };
  const copyMfaSecret = () => {
    if (mfa?.status !== 'mfa_enroll') return;
    void run(async () => {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(mfa.secret);
      else {
        const field = document.createElement('textarea');
        field.value = mfa.secret;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Kopiëren is niet toegestaan. Neem de zichtbare instelsleutel handmatig over.');
      }
      setNotice('Instelsleutel gekopieerd.');
    });
  };
  const requestReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim();
    void run(async () => {
      if (!repository.requestPasswordReset) throw new Error('Wachtwoord herstellen is hier niet beschikbaar.');
      await repository.requestPasswordReset(email);
      setRecoveryEmail(email);
      setNotice('De herstelmail is verstuurd. Vul hieronder de code uit de nieuwste e-mail in.');
      setScreen('password-recovery');
    });
  };
  const completeReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const email=String(fields.get('email')??'').trim();
    const code=String(fields.get('code')??'').trim();
    const password = String(fields.get('password') ?? '');
    if (password.length < 8) return setError('Gebruik een wachtwoord van minimaal 8 tekens.');
    if (password !== String(fields.get('repeat') ?? '')) return setError('De wachtwoorden zijn niet hetzelfde.');
    void run(async () => {
      if (!repository.completePasswordReset) throw new Error('Deze resetlink kan hier niet worden afgerond.');
      await repository.completePasswordReset(email,code,password);
      setNotice('Je wachtwoord is gewijzigd. Log nu opnieuw in.');
      setScreen('login');
    });
  };
  const finishStaffInvite=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const data=new FormData(event.currentTarget),email=String(data.get('email')||'').trim(),code=String(data.get('code')||'').trim(),password=String(data.get('password')||''),repeat=String(data.get('repeat')||'');if(password.length<8)return setError('Gebruik een wachtwoord van minimaal 8 tekens.');if(password!==repeat)return setError('De wachtwoorden zijn niet hetzelfde.');void run(async()=>{if(!repository.completeStaffInvite)throw new Error('Deze uitnodiging kan hier niet worden afgerond.');handleAuthentication(await repository.completeStaffInvite(email,code,password))})};

  const qrCodeUrl = mfa?.status === 'mfa_enroll' ? (mfa.qrCode.startsWith('data:') ? mfa.qrCode : `data:image/svg+xml;utf8,${encodeURIComponent(mfa.qrCode)}`) : '';

  return <section className="auth-screen">
    {screen==='staff-invite'&&<><span className="eyebrow">Uitnodiging</span><h1>Maak je account af</h1><p>{directEmailSession?'Kies een persoonlijk wachtwoord.':'Vul de code uit de nieuwste uitnodigingsmail in en kies een persoonlijk wachtwoord.'}</p><form className="form-card" onSubmit={finishStaffInvite}>{!directEmailSession&&<><label>E-mailadres<input name="email" type="email" autoComplete="email" required/></label><label>Zescijferige uitnodigingscode<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required/></label></>}<label>Kies een wachtwoord<input name="password" type="password" autoComplete="new-password" minLength={8} required/></label><label>Herhaal je wachtwoord<input name="repeat" type="password" autoComplete="new-password" minLength={8} required/></label><button className="auth-primary" disabled={busy}>{busy?'Account activeren…':'Account activeren'}</button></form></>}
    {screen==='password-recovery'&&<><span className="eyebrow">Wachtwoord herstellen</span><h1>Kies een nieuw wachtwoord</h1><p>{directEmailSession?'Gebruik een wachtwoord van minimaal 8 tekens.':'Vul de code uit de nieuwste herstelmail in. De code kan niet door een e-mailscanner worden gebruikt.'}</p><form className="form-card" onSubmit={completeReset}>{!directEmailSession&&<><label>E-mailadres<input name="email" type="email" autoComplete="email" defaultValue={recoveryEmail} required/></label><label>Zescijferige herstelcode<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required/></label></>}<label>Nieuw wachtwoord<input name="password" type="password" autoComplete="new-password" minLength={8} required/></label><label>Herhaal nieuw wachtwoord<input name="repeat" type="password" autoComplete="new-password" minLength={8} required/></label><button className="auth-primary" disabled={busy}>{busy?'Wachtwoord opslaan…':'Wachtwoord opslaan'}</button></form>{!directEmailSession&&<button className="auth-secondary" onClick={()=>setScreen('reset-request')}>Nieuwe code aanvragen</button>}</>}
    {screen==='reset-request'&&<><span className="eyebrow">Wachtwoord herstellen</span><h1>Wachtwoord vergeten?</h1><p>Vul je e-mailadres in. Als het account bestaat, ontvang je een link om een nieuw wachtwoord te kiezen.</p><form className="form-card" onSubmit={requestReset}><label>E-mailadres<input name="email" type="email" autoComplete="email" required/></label><button className="auth-primary" disabled={busy}>{busy?'Resetmail versturen…':'Stuur resetmail'}</button></form><button className="auth-secondary" onClick={()=>{setError('');setScreen('login')}}>Terug naar inloggen</button></>}
    {screen==='reset-sent'&&<><span className="eyebrow">Controleer je e-mail</span><h1>Herstelcode aangevraagd</h1><p>Gebruik uitsluitend de code uit de nieuwste e-mail.</p><button className="auth-secondary" onClick={()=>setScreen('password-recovery')}>Code invoeren</button></>}
    {screen==='mfa-enroll'&&mfa?.status==='mfa_enroll'&&<><span className="eyebrow">Extra beveiliging</span><h1>Koppel je authenticator-app</h1><p>Scan de QR-code met bijvoorbeeld Microsoft Authenticator of Google Authenticator.</p><div className="form-card mfa-card"><img className="mfa-qr" src={qrCodeUrl} alt="QR-code om Munks Werkt aan je authenticator-app te koppelen"/><details><summary>Kan je de QR-code niet scannen?</summary><p>Voeg in je authenticator-app handmatig een account toe en gebruik deze instelsleutel:</p><code className="mfa-secret">{mfa.secret}</code><button type="button" className="auth-secondary" disabled={busy} onClick={copyMfaSecret}>Kopieer instelsleutel</button></details><form onSubmit={verifyMfa}><label>Zescijferige code<input name="mfaCode" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required/></label><button className="auth-primary" disabled={busy}>{busy?'Controleren…':'Authenticator koppelen'}</button></form></div><p className="auth-note">Bewaar de instelsleutel niet in een bericht of onbeveiligd document. Bij verlies van je telefoon neem je contact op met je beheerder.</p></>}
    {screen==='mfa-challenge'&&mfa?.status==='mfa_challenge'&&<><span className="eyebrow">Extra beveiliging</span><h1>Vul je authenticatorcode in</h1><p>Open je authenticator-app en vul de actuele zescijferige code voor Munks Werkt in.</p><form className="form-card" onSubmit={verifyMfa}><label>Authenticatorcode<input name="mfaCode" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} autoFocus required/></label><button className="auth-primary" disabled={busy}>{busy?'Controleren…':'Veilig inloggen'}</button></form><p className="auth-note">Geen toegang meer tot je authenticator? Neem contact op met je beheerder om de koppeling na identiteitscontrole te laten herstellen.</p></>}
    {screen === 'privacy-document' && <section className="auth-document auth-privacy-document"><div className="auth-privacy-content"><header><button className="document-back" aria-label="Terug naar jouw privacy" onClick={() => setScreen('privacy')}>←</button><strong><span>MUNKS</span> WERKT</strong></header><span className="eyebrow">Jouw privacy</span><h1>Wat gebeurt er met je gegevens?</h1><p>Hier leggen we in gewone taal uit welke gegevens Munks Werkt gebruikt en wie deze kan bekijken.</p><div className="privacy-summary">We gebruiken je gegevens alleen om je traject te begeleiden, je voortgang te tonen en afspraken te maken over jouw volgende stap.</div><details open><summary>Welke gegevens bewaren we?</summary><p>Bijvoorbeeld je naam, contactgegevens, antwoorden, trajectvoortgang, afspraken, cv en de begin- en eindmeting.</p></details><details><summary>Wie kan wat bekijken?</summary><p>Jij en de betrokken begeleiders kunnen je trajectgegevens bekijken. De opdrachtgever ziet alleen de afgesproken voortgangs- en meetgegevens, niet al je persoonlijke antwoorden.</p></details><details><summary>Hoe zit het met de AI-assistent?</summary><p>De AI-assistent gebruikt alleen gegevens die nodig zijn voor jouw vraag. Gesprekken zijn niet automatisch zichtbaar voor begeleiders of de opdrachtgever.</p></details><details><summary>Hoe lang bewaren we gegevens?</summary><p>Gegevens worden niet langer bewaard dan nodig. De precieze bewaartermijnen staan in de volledige privacyverklaring.</p></details><details><summary>Welke rechten heb je?</summary><p>Je mag vragen welke gegevens we hebben, gegevens laten verbeteren en in bepaalde gevallen vragen om verwijdering of beperking.</p></details><a className="privacy-full-link" href={privacyFullUrl} target="_blank" rel="noreferrer">Open de volledige privacyverklaring</a><p className="privacy-question"><strong>Heb je een vraag?</strong><br/>Stel die aan je begeleider of aan de privacycontactpersoon van Munks.</p></div></section>}
    {screen === 'consent-document' && <section className="auth-document auth-privacy-document"><div className="auth-privacy-content consent-content"><header><button className="document-back" aria-label="Terug naar jouw privacy" onClick={() => setScreen('privacy')}><span aria-hidden="true">&larr;</span></button><strong><span>MUNKS</span> WERKT</strong></header><span className="eyebrow">Toestemming en informatie</span><h1>Jouw keuzes in Munks Werkt</h1><p>Lees rustig waarvoor je toestemming geeft. Je kunt hierover altijd vragen stellen aan je begeleider.</p><section className="consent-info-card"><span className="question-count">Nodig voor deelname</span><h2>Gebruik van je trajectgegevens</h2><p>Je gegevens worden gebruikt om je te begeleiden, je voortgang bij te houden en alleen de afgesproken voortgangs- en resultaatgegevens met de opdrachtgever te delen.</p><label className="check"><input type="checkbox" checked={consentAccepted} onChange={event => setConsentAccepted(event.target.checked)}/><span>Ik heb deze informatie gelezen en ga akkoord met het gebruik van mijn gegevens voor mijn traject.</span></label></section><section className="consent-info-card"><h2>Goed om te weten</h2><ul><li>Je persoonlijke antwoorden worden niet met de groep gedeeld.</li><li>Je AI-keuze maak je afzonderlijk op het volgende scherm.</li><li>Toestemming voor de talententest wordt bij die stap gevraagd.</li><li>Je kunt vragen stellen of een toestemming later intrekken.</li></ul></section><a className="privacy-full-link" href={consentUrl} download>Download het volledige toestemmingsformulier</a><button className="auth-primary" disabled={!consentAccepted} onClick={() => setScreen('privacy')}>Verder met activeren</button></div></section>}
    {screen === 'activate' && <><Progress step={1}/><span className="eyebrow">Eerste keer</span><h1>Activeer je account</h1><p>Je krijgt de activatiecode van je begeleider. Daarna kies je zelf een wachtwoord.</p><form className="form-card" onSubmit={activate}><label>E-mailadres<input name="email" type="email" autoComplete="email" required placeholder="jij@voorbeeld.nl"/></label><label>Activatiecode<input name="code" inputMode="numeric" pattern="[0-9]{6,8}" required placeholder="Bijvoorbeeld 482913"/></label><label>Kies een wachtwoord<input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="Minimaal 8 tekens"/></label><label>Herhaal je wachtwoord<input name="repeat" type="password" autoComplete="new-password" minLength={8} required/></label><button className="auth-primary" disabled={busy}>{busy?'Gegevens controleren…':'Verder naar privacy'}</button></form><button className="auth-secondary" onClick={() => setScreen('login')}>Ik heb al een account</button></>}

    {screen === 'privacy' && <><Progress step={2}/><span className="eyebrow">Jouw gegevens</span><h1>Jouw privacy</h1><p>We gebruiken alleen gegevens die nodig zijn voor jouw traject. Hier lees je in het kort wat dat betekent.</p><div className="form-card"><h2>Wie ziet jouw gegevens?</h2><p>Je antwoorden zijn alleen zichtbaar voor jou en de bevoegde begeleiders binnen jouw traject. De RSD ziet alleen de afgesproken voortgangs- en resultaatgegevens.</p><h2>AI-assistent en talententest</h2><p>AI kan fouten maken en neemt geen beslissingen over jou. Je begeleiders bespreken de uitslag van de talententest met je en blijven verantwoordelijk voor het uiteindelijke advies.</p><a className="document-link" href={privacySummaryUrl} target="_blank" rel="noreferrer">Open de privacyverklaring</a><label className="check"><input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)}/><span>Ik heb de privacyverklaring gelezen en ga hiermee akkoord.</span></label><a className="document-link" href={consentUrl} target="_blank" rel="noreferrer">Open het toestemmingsformulier</a><label className="check"><input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}/><span>Ik heb het toestemmingsformulier gelezen en ga hiermee akkoord.</span></label></div><button className="auth-primary" disabled={!privacyAccepted||!consentAccepted} onClick={() => {setError('');setScreen('ai-consent')}}>Verder naar toestemming</button><button className="auth-secondary" onClick={() => setScreen('activate')}>Terug</button></>}

    {screen === 'ai-consent' && <><Progress step={2}/><span className="eyebrow">Jouw keuze</span><h1>De AI-assistent</h1><p>Je bepaalt zelf of je de AI-assistent wilt gebruiken. Je keuze heeft geen gevolgen voor je deelname.</p><div className="form-card"><h2>Waarmee kan de AI-assistent helpen?</h2><p>Met vragen over werk of opleiding, je cv, het voorbereiden van een gesprek en jouw volgende stap.</p><h2>Goed om te weten</h2><ul><li>Je praat met AI en niet met een echte begeleider.</li><li>Vragen buiten het traject worden niet beantwoord.</li><li>Gesprekken zijn niet automatisch zichtbaar voor begeleiders of de RSD.</li><li>Deel geen BSN, wachtwoorden of identiteitsbewijs.</li></ul><fieldset><legend>Wil je de AI-assistent gebruiken?</legend><label className="check"><input type="radio" name="ai" checked={aiEnabled===true} onChange={() => setAiEnabled(true)}/><span>Ja, ik wil de AI-assistent gebruiken.</span></label><label className="check"><input type="radio" name="ai" checked={aiEnabled===false} onChange={() => setAiEnabled(false)}/><span>Nee, nu niet.</span></label></fieldset></div><button className="auth-primary" disabled={busy||aiEnabled===undefined} onClick={finishConsent}>{busy?'Account activeren…':'Account activeren'}</button><button className="auth-secondary" onClick={() => setScreen('privacy')}>Terug</button></>}

    {screen === 'ready' && <><Progress step={3}/><span className="eyebrow">Gelukt</span><h1>Je account is klaar</h1><p>Je kunt nu veilig verder naar Munks Werkt.</p><button className="auth-primary" onClick={() => setScreen('login')}>Naar inloggen</button><div className="auth-note">Log in met je e-mailadres en wachtwoord om je rol veilig op te halen.</div></>}

    {screen === 'login' && <><span className="eyebrow">Welkom terug</span><h1>Inloggen</h1><p>Gebruik je e-mailadres en wachtwoord.</p><form className="form-card" onSubmit={login}><label>E-mailadres<input name="email" type="email" autoComplete="email" required/></label><label>Wachtwoord<input name="password" type="password" autoComplete="current-password" minLength={8} required/></label><button className="auth-primary" disabled={busy}>{busy?'Inloggen…':'Inloggen'}</button></form>{repository.requestPasswordReset&&<button className="auth-secondary" onClick={()=>{setError('');setNotice('');setScreen('reset-request')}}>Wachtwoord vergeten?</button>}<button className="auth-secondary" onClick={() => setScreen('activate')}>Eerste keer? Activeer je account</button></>}
    {notice && <p className="auth-note" role="status">{notice}</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
  </section>;
}
