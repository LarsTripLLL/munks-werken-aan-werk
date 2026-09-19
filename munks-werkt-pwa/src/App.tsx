import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthRepository, ParticipantHome, SessionUser } from "./domain";
import type { AppRole } from "./domain";
import { DashboardPortal } from "./DashboardPortal";
import { MessageInbox } from "./MessageInbox";
import { AuthFlow } from "./AuthFlow";
import { StepOneFlow } from "./StepOneFlow";
import { StepTwoFlow } from "./StepTwoFlow";
import { StepThreeFlow } from "./StepThreeFlow";
import { StepFourFlow } from "./StepFourFlow";
import { StepFiveFlow } from "./StepFiveFlow";
import { StepSixFlow } from "./StepSixFlow";
import { StepSevenFlow } from "./StepSevenFlow";
import { DemoAnswerRepository } from "./repositories/demoAnswerRepository";
import { DemoTalentTestRepository } from "./repositories/demoTalentTestRepository";
import { SupabaseTalentTestRepository } from "./repositories/supabaseTalentTestRepository";
import { DemoAuthRepository } from "./repositories/demoAuthRepository";
import { SupabaseAuthRepository } from "./repositories/supabaseAuthRepository";
import { DemoParticipantRepository } from "./repositories/demoParticipantRepository";
import { SupabaseParticipantRepository } from "./repositories/supabaseParticipantRepository";
import { SupabaseProgressRepository } from "./repositories/supabaseProgressRepository";
import { SupabaseAnswerRepository } from "./repositories/supabaseAnswerRepository";
import { SupabaseDocumentRepository } from "./repositories/supabaseDocumentRepository";
import { ParticipantDocuments } from "./ParticipantDocuments";
import { DemoDashboardRepository } from "./repositories/demoDashboardRepository";
import { DemoMessageRepository } from "./repositories/demoMessageRepository";
import { DemoStaffMessageRepository } from "./repositories/demoStaffMessageRepository";
import { ApiMessageRepository } from "./repositories/apiMessageRepository";
import { ApiStaffMessageRepository } from "./repositories/apiStaffMessageRepository";
import { ApiDashboardRepository } from "./repositories/apiDashboardRepository";
import { SupabaseDashboardRepository } from "./repositories/supabaseDashboardRepository";
import { SupabaseMessageRepositories } from "./repositories/supabaseMessageRepositories";
import { SupabaseAiRepository } from "./repositories/supabaseAiRepository";
import { AiAssistant } from "./AiAssistant";
import { openAiAssistant } from "./aiNavigation";
import logoUrl from "./assets/Munks-Werkt-logo.png";
import mountainUrl from "./assets/Munks-Werkt-bergachtergrond.png";

const useSupabaseAuth = import.meta.env.VITE_AUTH_MODE === "supabase";
const repository = useSupabaseAuth
  ? new SupabaseParticipantRepository(
      import.meta.env.VITE_SUPABASE_URL ?? "",
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    )
  : new DemoParticipantRepository();
const progressRepository = useSupabaseAuth
  ? new SupabaseProgressRepository(
      import.meta.env.VITE_SUPABASE_URL ?? "",
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    )
  : undefined;
const authRepository: AuthRepository = useSupabaseAuth
  ? new SupabaseAuthRepository(
      import.meta.env.VITE_SUPABASE_URL ?? "",
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    )
  : new DemoAuthRepository();
const answerRepository = useSupabaseAuth
  ? new SupabaseAnswerRepository(
      import.meta.env.VITE_SUPABASE_URL ?? "",
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    )
  : new DemoAnswerRepository();
const documentRepository = useSupabaseAuth
  ? new SupabaseDocumentRepository(
      import.meta.env.VITE_SUPABASE_URL ?? "",
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    )
  : undefined;
const talentTestRepository = useSupabaseAuth
  ? new SupabaseTalentTestRepository(import.meta.env.VITE_SUPABASE_URL ?? "", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "")
  : new DemoTalentTestRepository();
const useApi = import.meta.env.VITE_DATA_MODE === "api";
const dashboardRepository = useSupabaseAuth
  ? new SupabaseDashboardRepository(
      import.meta.env.VITE_SUPABASE_URL ?? "",
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    )
  : useApi
    ? new ApiDashboardRepository()
    : new DemoDashboardRepository();
const messageRepository = useApi
  ? new ApiMessageRepository()
  : new DemoMessageRepository();
const staffMessageRepository = useApi
    ? new ApiStaffMessageRepository()
    : new DemoStaffMessageRepository();
const supabaseMessageRepositories = useSupabaseAuth
  ? new SupabaseMessageRepositories(import.meta.env.VITE_SUPABASE_URL ?? "", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "")
  : undefined;
const aiRepository = useSupabaseAuth
  ? new SupabaseAiRepository(import.meta.env.VITE_SUPABASE_URL ?? "", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "")
  : undefined;
type MainScreen = "home" | "route" | "messages" | "environment";
type Screen =
  | MainScreen
  | "fit"
  | "documents"
  | "appointments"
  | "assistant"
  | "goals"
  | "step1"
  | "step2"
  | "step3"
  | "step4"
  | "step5"
  | "step6"
  | "step7";

const Icon = ({ name }: { name: MainScreen }) => {
  const paths: Record<MainScreen, ReactNode> = {
    home: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.5 6h4a3 3 0 0 1 0 6h-1a3 3 0 0 0 0 6h4" />
      </>
    ),
    messages: (
      <>
        <path d="M4 4h16v12H9l-5 4V4Z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
    environment: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

function Mountain({ data }: { data: ParticipantHome }) {
  const points = [
    [86, 310],
    [123, 273],
    [177, 229],
    [228, 183],
    [272, 139],
    [305, 101],
    [317, 68],
  ];
  const routeSegments = [
    "M52 340 C68 322 75 316 86 310",
    "C112 300 100 279 123 273",
    "C150 263 193 257 177 229",
    "C163 204 218 205 228 183",
    "C245 159 253 155 272 139",
    "C296 121 288 110 305 101",
    "C319 88 315 76 317 68",
  ];
  const routePath = routeSegments.join(" ");
  const completedPath = routeSegments.slice(0, data.currentStep).join(" ");
  const markers = points.map(([x, y], index) => {
    const step = index + 1;
    const state =
      step < data.currentStep
        ? "done"
        : step === data.currentStep
          ? "current"
          : "future";
    return (
      <g className={`route-marker ${state}`} key={step}>
        <circle cx={x} cy={y} r={state === "current" ? 18 : 14} />
        <text x={x} y={y}>
          {step}
        </text>
      </g>
    );
  });
  return (
    <svg
      className="mountain"
      viewBox="0 0 400 340"
      role="img"
      aria-label={`Je bent bij stap ${data.currentStep} van 7`}
    >
      <image
        href={mountainUrl}
        width="400"
        height="340"
        preserveAspectRatio="xMidYMid slice"
      />
      <path className="route-base" d={routePath} />
      <path className="route-done" d={completedPath} />
      {markers}
    </svg>
  );
}

export function App() {
  const isStaffInvite = location.hash.includes("type=invite") || location.hash.includes("type=recovery") || location.search.includes("type=invite") || location.search.includes("type=recovery");
  const requestedRole = new URLSearchParams(location.search).get(
    "role",
  ) as AppRole | null;
  const [sessionUser, setSessionUser] = useState<SessionUser>();
  const [authChecked, setAuthChecked] = useState(!useSupabaseAuth || isStaffInvite);
  const authenticatedRole = sessionUser?.role;
  const selectedRole = useSupabaseAuth ? authenticatedRole : requestedRole;
  const dashboardRole =
    selectedRole === "coach" ||
    selectedRole === "project_leader" ||
    selectedRole === "commissioner"
      ? selectedRole
      : undefined;
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionRevision, setSessionRevision] = useState(0);
  const [data, setData] = useState<ParticipantHome>();
  const [error, setError] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [aiPrompt, setAiPrompt] = useState("");
  useEffect(() => {
    const listener = (event: Event) => {
      setAiPrompt((event as CustomEvent<string>).detail || "");
      setScreen("assistant");
    };
    window.addEventListener("munks-open-ai", listener);
    return () => window.removeEventListener("munks-open-ai", listener);
  }, []);
  const signOut = () => {
    localStorage.removeItem("munks-werkt-access-token");
    location.assign(`${location.origin}${location.pathname}`);
  };
  const completeStep = async (stepNumber: number) => {
    if (progressRepository) await progressRepository.completeStep(stepNumber);
    setData((current) => {
      if (!current) return current;
      const nextStep = Math.min(stepNumber + 1, 7);
      const nextTitle =
        current.steps.find((step) => step.number === nextStep)?.title ??
        current.currentTitle;
      return {
        ...current,
        currentStep: nextStep,
        currentTitle: nextTitle,
        steps: current.steps.map((step) => ({
          ...step,
          status:
            step.number <= stepNumber
              ? "completed"
              : step.number === nextStep
                ? "current"
                : step.number === nextStep + 1
                  ? "available"
                  : "locked",
        })),
      };
    });
  };
  useEffect(() => {
    if (!useSupabaseAuth || !authRepository.restoreSession || isStaffInvite) return;
    let active = true;
    authRepository
      .restoreSession()
      .then((user) => {
        if (!active || !user) return;
        setSessionUser(user);
        setAuthenticated(true);
      })
      .finally(() => active && setAuthChecked(true));
    return () => {
      active = false;
    };
  }, [isStaffInvite]);
  useEffect(() => {
    if (!useSupabaseAuth || !authenticated || !authRepository.restoreSession) return;
    let active = true;
    const recheckSession = async () => {
      if (document.visibilityState !== "visible") return;
      setAuthChecked(false);
      try {
        const user = await authRepository.restoreSession?.();
        if (!active) return;
        setData(undefined);
        if (user) {
          setSessionUser(user);
          setSessionRevision((current) => current + 1);
        } else {
          setSessionUser(undefined);
          setScreen("home");
          setAuthenticated(false);
        }
      } finally {
        if (active) setAuthChecked(true);
      }
    };
    document.addEventListener("visibilitychange", recheckSession);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", recheckSession);
    };
  }, [authenticated]);
  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    repository
      .getHome(controller.signal)
      .then(setData)
      .catch((e) => e.name !== "AbortError" && setError(true));
    return () => controller.abort();
  }, [authenticated, sessionRevision]);
  if (!authChecked)
    return (
      <main className="center" aria-live="polite">
        Aanmelding wordt gecontroleerd…
      </main>
    );
  if (!authenticated || isStaffInvite)
    return (
      <main className="app-shell">
        <section className="phone auth-phone">
          <header className="app-header auth-header">
            <img src={logoUrl} alt="Munks Werkt" />
          </header>
          <AuthFlow
            repository={authRepository}
            onAuthenticated={(user) => {
              setScreen("home");
              setData(undefined);
              setError(false);
              setSessionUser(user);
              setAuthenticated(true);
            }}
          />
        </section>
      </main>
    );
  if (dashboardRole)
    return (
      <DashboardPortal
        key={sessionRevision}
        role={dashboardRole}
        repository={dashboardRepository}
        messageRepository={supabaseMessageRepositories ? supabaseMessageRepositories.staff() : staffMessageRepository}
        onSignOut={signOut}
      />
    );
  if (error)
    return (
      <main className="center">
        <h1>De app kan nu niet worden geladen</h1>
        <button onClick={() => location.reload()}>Probeer opnieuw</button>
      </main>
    );
  if (!data)
    return (
      <main className="center" aria-live="polite">
        Munks Werkt wordt geladen…
      </main>
    );
  return (
    <main className="app-shell">
      <section className="phone">
        <header className="app-header">
          <img src={logoUrl} alt="Munks Werkt" />
        </header>
        {screen === "home" && (
          <>
            <section className="welcome">
              <h1>Fijn dat je er bent</h1>
              <p>Wat wil je vandaag doen voor jouw toekomst?</p>
            </section>
            <section className="journey-card">
              <div className="journey-copy">
                <span>Je huidige stap</span>
                <h2>{data.currentTitle}</h2>
              </div>
              <Mountain data={data} />
            </section>
            <button className="primary" onClick={() => setScreen("route")}>
              Bekijk je traject <span>→</span>
            </button>
            <button
              className="appointment appointment-button"
              onClick={() => setScreen("appointments")}
            >
              <span className="round" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h2M14 14h2M8 17h2M14 17h2"/></svg></span>
              <div>
                <small>Volgende afspraak</small>
                <strong>{data.appointment.title ? `${data.appointment.stepNumber ? `Stap ${data.appointment.stepNumber} · ` : ''}${data.appointment.title}` : data.appointment.dateLabel}</strong>
                {data.appointment.title && <p>{data.appointment.dateLabel}{data.appointment.timeLabel ? ` · ${data.appointment.timeLabel}` : ''}</p>}
                {(data.appointment.location || data.appointment.coachName) && <p>{[data.appointment.location,data.appointment.coachName].filter(Boolean).join(' · ')}</p>}
              </div>
              <span>›</span>
            </button>
            <section className="quick">
              <button onClick={() => setScreen("fit")}>Wat bij mij past</button>
              <button onClick={() => setScreen("documents")}>
                Mijn documenten
              </button>
              <button onClick={() => setScreen("appointments")}>
                Mijn afspraken
              </button>
              <button onClick={() => setScreen("goals")}>Mijn doelen</button>
              <button onClick={() => openAiAssistant()}>AI-assistent</button>
              <button onClick={signOut}>Uitloggen</button>
            </section>
          </>
        )}
        {screen === "route" && (
          <section className="screen">
            <span className="eyebrow">Jouw traject</span>
            <h1>Jouw route</h1>
            <p>Bekijk waar je bent en welke stappen nog komen.</p>
            <Mountain data={data} />
            <ol>
              {data.steps.map((step) => (
                <li className={step.status} key={step.number}>
                  <button
                    onClick={() => setScreen(`step${step.number}` as Screen)}
                  >
                    <span>{step.number}</span>
                    <strong>{step.title}</strong>
                    <em>Openen</em>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}
        {screen === "fit" && (
          <section className="screen">
            <span className="eyebrow">Jouw profiel</span>
            <h1>Wat bij mij past</h1>
            <p>
              Hier komen jouw talenten, interesses en richtingen uit het traject
              bij elkaar.
            </p>
            <article>
              <h2>Jouw resultaten</h2>
              <p>
                De resultaten van de talententest worden hier beschikbaar nadat
                je ze met je begeleider hebt besproken.
              </p>
              <button
                className="flow-primary"
                onClick={() => setScreen("step2")}
              >
                Bekijk stap 2
              </button>
            </article>
          </section>
        )}
        {screen === "documents" &&
          (documentRepository ? (
            <ParticipantDocuments repository={documentRepository} answerRepository={answerRepository} participantId={data.user.id} trajectoryCode={data.trajectoryCode} />
          ) : (
            <section className="screen">
              <span className="eyebrow">Jouw bestanden</span>
              <h1>Mijn documenten</h1>
              <p>Er zijn nog geen documenten beschikbaar.</p>
            </section>
          ))}
        {screen === "appointments" && (
          <section className="screen">
            <span className="eyebrow">Jouw planning</span>
            <h1>Mijn afspraken</h1>
            <p>Hier zie je jouw komende afspraken en bijeenkomsten.</p>
            {(data.appointments?.length ? data.appointments : [data.appointment]).map((appointment,index) => <article key={'id' in appointment ? appointment.id : index}>
              <h2>{appointment.title || (index===0?'Volgende afspraak':'Afspraak')}</h2>
              <strong>{appointment.dateLabel}</strong>
              <p>{appointment.timeLabel}{appointment.coachName ? ` · ${appointment.coachName}` : ''}</p>
              {appointment.stepNumber&&<p>Trajectstap {appointment.stepNumber}</p>}
              {appointment.location&&<p>Locatie: {appointment.location}</p>}
              {appointment.explanation&&<p>{appointment.explanation}</p>}
            </article>)}
          </section>
        )}
        {screen === "goals" && (
          <section className="screen">
            <span className="eyebrow">Jouw toekomst</span>
            <h1>Mijn doelen</h1>
            <p>Hier houd je bij waar je tijdens het traject aan wilt werken.</p>
            <article>
              <h2>Mijn doel</h2>
              <p>Ontdekken welk werk of welke opleiding bij mij past.</p>
              <button
                className="flow-primary"
                onClick={() => setScreen("step7")}
              >
                Bekijk mijn volgende stap
              </button>
            </article>
          </section>
        )}
        {screen === "assistant" && aiRepository && (
          <AiAssistant repository={aiRepository} initialQuestion={aiPrompt} onClose={() => setScreen("home")} />
        )}
        {screen === "step1" && (
          <StepOneFlow
            repository={answerRepository}
            participantId={data.user.id}
            trajectoryCode={data.trajectoryCode}
            onClose={() => setScreen("route")}
            onComplete={() => completeStep(1)}
          />
        )}
        {screen === "step2" && (
          <StepTwoFlow
            repository={talentTestRepository}
            participantId={data.user.id}
            trajectoryCode={data.trajectoryCode}
            onClose={() => setScreen("route")}
            onComplete={() => completeStep(2)}
          />
        )}
        {screen === "step3" && (
          <StepThreeFlow
            repository={answerRepository}
            participantId={data.user.id}
            trajectoryCode={data.trajectoryCode}
            onClose={() => setScreen("route")}
            onComplete={() => completeStep(3)}
          />
        )}
        {screen === "step4" && (
          <StepFourFlow
            repository={answerRepository}
            participantId={data.user.id}
            trajectoryCode={data.trajectoryCode}
            onEdit={() => setScreen("step3")}
            onClose={() => setScreen("route")}
          />
        )}
        {screen === "step5" && (
          <StepFiveFlow
            repository={answerRepository}
            participantId={data.user.id}
            trajectoryCode={data.trajectoryCode}
            onClose={() => setScreen("route")}
            onComplete={() => completeStep(5)}
          />
        )}
        {screen === "step6" && (
          <StepSixFlow
            repository={answerRepository}
            participantId={data.user.id}
            trajectoryCode={data.trajectoryCode}
            onClose={() => setScreen("route")}
            onComplete={() => completeStep(6)}
          />
        )}
        {screen === "step7" && (
          <StepSevenFlow
            repository={answerRepository}
            participantId={data.user.id}
            trajectoryCode={data.trajectoryCode}
            onClose={() => setScreen("route")}
            onHome={() => setScreen("home")}
            outcome={data.outcome}
          />
        )}
        {screen === "messages" && (
          <MessageInbox
            repository={supabaseMessageRepositories ? supabaseMessageRepositories.participant(data.trajectoryCode) : messageRepository}
            onUnreadChange={(unreadMessages) => setData(current => current ? { ...current, unreadMessages } : current)}
          />
        )}
        {screen === "environment" && (
          <section className="screen">
            <span className="eyebrow">Persoonlijk</span>
            <h1>Mijn omgeving</h1>
            <p>Hier vind je jouw account- en trajectgegevens.</p>
            <article>
              <h2>Mijn gegevens</h2>
              <p><strong>Naam</strong><br />{data.user.displayName}</p>
              <p><strong>Deelnemer</strong></p>
            </article>
            <article>
              <h2>{data.trajectoryName || "Mijn traject"}</h2>
              <p><strong>Traject</strong><br />{data.trajectoryName || data.trajectoryCode}</p>
              <p><strong>Status</strong><br />{data.trajectoryStatus === "planned" ? "Gepland" : data.trajectoryStatus === "completed" ? "Afgerond" : "Actief"}</p>
              <p><strong>Huidige stap</strong><br />Stap {data.currentStep} · {data.currentTitle}</p>
            </article>
            <section className="quick">
              <button onClick={() => setScreen("documents")}>Mijn documenten</button>
              <button onClick={() => setScreen("appointments")}>Mijn afspraken</button>
            </section>
          </section>
        )}
        {!screen.startsWith("step") && (
          <nav className="bottom" aria-label="Hoofdnavigatie">
            {(["home", "route", "messages", "environment"] as MainScreen[]).map(
              (item) => (
                <button
                  className={screen === item ? "active" : ""}
                  onClick={() => setScreen(item)}
                  key={item}
                >
                  <Icon name={item} />
                  <span>
                    {
                      {
                        home: "Home",
                        route: "Traject",
                        messages: "Berichten",
                        environment: "Mijn omgeving",
                      }[item]
                    }
                  </span>
                  {item === "messages" && data.unreadMessages > 0 && <i className="nav-badge">{data.unreadMessages}</i>}
                </button>
              ),
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
