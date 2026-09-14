import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ParticipantHome } from './domain';
import type { AppRole } from './domain';
import { DashboardPortal } from './DashboardPortal';
import { MessageInbox } from './MessageInbox';
import { AuthFlow } from './AuthFlow';
import { StepOneFlow } from './StepOneFlow';
import { StepTwoFlow } from './StepTwoFlow';
import { StepThreeFlow } from './StepThreeFlow';
import { StepFourFlow } from './StepFourFlow';
import { StepFiveFlow } from './StepFiveFlow';
import { StepSixFlow } from './StepSixFlow';
import { StepSevenFlow } from './StepSevenFlow';
import { DemoAnswerRepository } from './repositories/demoAnswerRepository';
import { DemoTalentTestRepository } from './repositories/demoTalentTestRepository';
import { DemoAuthRepository } from './repositories/demoAuthRepository';
import { DemoParticipantRepository } from './repositories/demoParticipantRepository';
import { DemoDashboardRepository } from './repositories/demoDashboardRepository';
import { DemoMessageRepository } from './repositories/demoMessageRepository';
import { DemoStaffMessageRepository } from './repositories/demoStaffMessageRepository';
import { ApiMessageRepository } from './repositories/apiMessageRepository';
import { ApiStaffMessageRepository } from './repositories/apiStaffMessageRepository';
import logoUrl from './assets/Munks-Werkt-logo.png';
import mountainUrl from './assets/Munks-Werkt-bergachtergrond.png';

const repository = new DemoParticipantRepository();
const authRepository = new DemoAuthRepository();
const answerRepository = new DemoAnswerRepository();
const talentTestRepository = new DemoTalentTestRepository();
const dashboardRepository = new DemoDashboardRepository();
const useApi = import.meta.env.VITE_DATA_MODE === 'api';
const messageRepository = useApi ? new ApiMessageRepository() : new DemoMessageRepository();
const staffMessageRepository = useApi ? new ApiStaffMessageRepository() : new DemoStaffMessageRepository();
type MainScreen = 'home' | 'route' | 'messages' | 'environment';
type Screen = MainScreen | 'fit' | 'documents' | 'appointments' | 'goals' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6' | 'step7';

const Icon = ({ name }: { name: MainScreen }) => {
  const paths: Record<MainScreen, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7"/></>,
    route: <><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6h4a3 3 0 0 1 0 6h-1a3 3 0 0 0 0 6h4"/></>,
    messages: <><path d="M4 4h16v12H9l-5 4V4Z"/><path d="M8 9h8M8 12h5"/></>,
    environment: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
};

function Mountain({ data }: { data: ParticipantHome }) {
  const points = [[86,310],[123,273],[177,229],[228,183],[272,139],[305,101],[317,68]];
  const routeSegments = [
    'M52 340 C68 322 75 316 86 310',
    'C112 300 100 279 123 273',
    'C150 263 193 257 177 229',
    'C163 204 218 205 228 183',
    'C245 159 253 155 272 139',
    'C296 121 288 110 305 101',
    'C319 88 315 76 317 68',
  ];
  const routePath = routeSegments.join(' ');
  const completedPath = routeSegments.slice(0, data.currentStep).join(' ');
  const markers = points.map(([x,y], index) => {
    const step = index + 1;
    const state = step < data.currentStep ? 'done' : step === data.currentStep ? 'current' : 'future';
    return <g className={`route-marker ${state}`} key={step}><circle cx={x} cy={y} r={state === 'current' ? 18 : 14}/><text x={x} y={y}>{step}</text></g>;
  });
  return <svg className="mountain" viewBox="0 0 400 340" role="img" aria-label={`Je bent bij stap ${data.currentStep} van 7`}>
    <image href={mountainUrl} width="400" height="340" preserveAspectRatio="xMidYMid slice"/>
    <path className="route-base" d={routePath}/>
    <path className="route-done" d={completedPath}/>
    {markers}
  </svg>;
}

export function App() {
  const requestedRole = new URLSearchParams(location.search).get('role') as AppRole | null;
  const dashboardRole = requestedRole === 'coach' || requestedRole === 'project_leader' || requestedRole === 'commissioner' ? requestedRole : undefined;
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<ParticipantHome>();
  const [error, setError] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    repository.getHome(controller.signal).then(setData).catch(e => e.name !== 'AbortError' && setError(true));
    return () => controller.abort();
  }, [authenticated]);
  if (!authenticated) return <main className="app-shell"><section className="phone auth-phone"><header className="app-header auth-header"><img src={logoUrl} alt="Munks Werkt"/></header><AuthFlow repository={authRepository} onAuthenticated={() => setAuthenticated(true)}/></section></main>;
  if (dashboardRole) return <DashboardPortal role={dashboardRole} repository={dashboardRepository} messageRepository={staffMessageRepository}/>;
  if (error) return <main className="center"><h1>De app kan nu niet worden geladen</h1><button onClick={() => location.reload()}>Probeer opnieuw</button></main>;
  if (!data) return <main className="center" aria-live="polite">Munks Werkt wordt geladen…</main>;
  return <main className="app-shell"><section className="phone">
    <header className="app-header"><img src={logoUrl} alt="Munks Werkt"/><button aria-label={`Meldingen, ${data.unreadMessages} ongelezen`} className="bell">♢<span/></button></header>
    {screen === 'home' && <>
      <section className="welcome"><h1>Fijn dat je er bent</h1><p>Wat wil je vandaag doen voor jouw toekomst?</p></section>
      <section className="journey-card"><div className="journey-copy"><span>Je huidige stap</span><h2>{data.currentTitle}</h2></div><Mountain data={data}/></section>
      <button className="primary" onClick={() => setScreen('route')}>Bekijk je traject <span>→</span></button>
      <button className="appointment appointment-button" onClick={() => setScreen('appointments')}><span className="round">□</span><div><small>Volgende afspraak</small><strong>{data.appointment.dateLabel}</strong><p>{data.appointment.timeLabel} · {data.appointment.coachName}</p></div><span>›</span></button>
      <section className="quick"><button onClick={() => setScreen('fit')}>Wat bij mij past</button><button onClick={() => setScreen('documents')}>Mijn documenten</button><button onClick={() => setScreen('appointments')}>Mijn afspraken</button><button onClick={() => setScreen('goals')}>Mijn doelen</button></section>
    </>}
    {screen === 'route' && <section className="screen"><span className="eyebrow">Jouw traject</span><h1>Jouw route</h1><p>Bekijk waar je bent en welke stappen nog komen.</p><Mountain data={data}/><ol>{data.steps.map(step => <li className={step.status} key={step.number}><button onClick={() => setScreen(`step${step.number}` as Screen)}><span>{step.number}</span><strong>{step.title}</strong><em>Openen</em></button></li>)}</ol></section>}
    {screen === 'fit' && <section className="screen"><span className="eyebrow">Jouw profiel</span><h1>Wat bij mij past</h1><p>Hier komen jouw talenten, interesses en richtingen uit het traject bij elkaar.</p><article><h2>Jouw resultaten</h2><p>De resultaten van de talententest worden hier beschikbaar nadat je ze met je begeleider hebt besproken.</p><button className="flow-primary" onClick={() => setScreen('step2')}>Bekijk stap 2</button></article></section>}
    {screen === 'documents' && <section className="screen"><span className="eyebrow">Jouw bestanden</span><h1>Mijn documenten</h1><p>Bekijk de documenten die tijdens jouw traject beschikbaar komen.</p><article><h2>Documenten</h2><p>Talententest — beschikbaar na de bespreking</p><p>Mijn cv — nog niet afgerond</p><p>Mijn volgende stap — nog niet beschikbaar</p></article></section>}
    {screen === 'appointments' && <section className="screen"><span className="eyebrow">Jouw planning</span><h1>Mijn afspraken</h1><p>Hier zie je jouw komende afspraken en bijeenkomsten.</p><article><h2>Volgende afspraak</h2><strong>{data.appointment.dateLabel}</strong><p>{data.appointment.timeLabel} · {data.appointment.coachName}</p></article></section>}
    {screen === 'goals' && <section className="screen"><span className="eyebrow">Jouw toekomst</span><h1>Mijn doelen</h1><p>Hier houd je bij waar je tijdens het traject aan wilt werken.</p><article><h2>Mijn doel</h2><p>Ontdekken welk werk of welke opleiding bij mij past.</p><button className="flow-primary" onClick={() => setScreen('step7')}>Bekijk mijn volgende stap</button></article></section>}
    {screen === 'step1' && <StepOneFlow repository={answerRepository} participantId={data.user.id} trajectoryCode={data.trajectoryCode} onClose={() => setScreen('route')}/>} 
    {screen === 'step2' && <StepTwoFlow repository={talentTestRepository} participantId={data.user.id} trajectoryCode={data.trajectoryCode} onClose={() => setScreen('route')}/>} 
    {screen === 'step3' && <StepThreeFlow repository={answerRepository} participantId={data.user.id} trajectoryCode={data.trajectoryCode} onClose={() => setScreen('route')}/>} 
    {screen === 'step4' && <StepFourFlow repository={answerRepository} participantId={data.user.id} trajectoryCode={data.trajectoryCode} onEdit={() => setScreen('step3')} onClose={() => setScreen('route')}/>} 
    {screen === 'step5' && <StepFiveFlow repository={answerRepository} participantId={data.user.id} trajectoryCode={data.trajectoryCode} onClose={() => setScreen('route')}/>} 
    {screen === 'step6' && <StepSixFlow repository={answerRepository} participantId={data.user.id} trajectoryCode={data.trajectoryCode} onClose={() => setScreen('route')}/>} 
    {screen === 'step7' && <StepSevenFlow repository={answerRepository} participantId={data.user.id} trajectoryCode={data.trajectoryCode} onClose={() => setScreen('route')} onHome={() => setScreen('home')}/>} 
    {screen === 'messages' && <MessageInbox repository={messageRepository}/>} 
    {screen === 'environment' && <section className="screen"><span className="eyebrow">Persoonlijk</span><h1>Mijn omgeving</h1><p>Je gegevens, documenten, afspraken en instellingen komen hier bij elkaar.</p></section>}
    {!screen.startsWith('step') && <nav className="bottom" aria-label="Hoofdnavigatie">{(['home','route','messages','environment'] as MainScreen[]).map(item => <button className={screen===item?'active':''} onClick={() => setScreen(item)} key={item}><Icon name={item}/><span>{{home:'Home',route:'Traject',messages:'Berichten',environment:'Mijn omgeving'}[item]}</span></button>)}</nav>}
  </section></main>;
}
