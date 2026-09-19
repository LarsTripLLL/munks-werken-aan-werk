import { useEffect, useState } from "react";
import type {
  AppRole,
  DashboardParticipant,
  DashboardRepository,
  DashboardTrajectory,
  StaffMessageRepository,
  StaffMessageThread,
} from "./domain";
import { DashboardAdmin } from "./DashboardAdmin";
import { AppointmentsAdmin } from "./AppointmentsAdmin";
import { StaffInbox } from "./StaffInbox";
import { UsersRoles } from "./UsersRoles";
import { OrganizationsAdmin } from "./OrganizationsAdmin";
import { measurementSubjects } from "./trajectoryDefinition";
import logoUrl from "../../pilot-app/assets/Munks-Werkt-logo.png";

const labels = {
  coach: "Begeleidersdashboard",
  project_leader: "Dashboard Applicatiebeheer",
  commissioner: "Opdrachtgeversdashboard",
} as const;

const count = (values: boolean[]) => values.filter(Boolean).length;
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] || character,
  );
const rsdDetailId = new URLSearchParams(location.search).get("deelnemer");
const rsdTrajectoryCode = new URLSearchParams(location.search).get("traject");

function RsdParticipantPage({
  participant,
  trajectory,
  onSignOut,
}: {
  participant: DashboardParticipant;
  trajectory: DashboardTrajectory;
  onSignOut: () => void;
}) {
  const dashboardUrl = new URL(location.href);
  dashboardUrl.searchParams.delete("deelnemer");
  dashboardUrl.searchParams.delete("traject");
  const back = () => {
    window.close();
    if (!window.closed) location.assign(dashboardUrl.href);
  };
  return (
    <main className="rsd-detail-page">
      <button className="rsd-back" onClick={back}>
        ← Terug naar overzicht
      </button>
      <header>
        <img src={logoUrl} alt="Munks Werkt" />
        <span>{trajectory.commissionerName}</span>
        <button className="session-logout" onClick={onSignOut}>
          Uitloggen
        </button>
      </header>
      <section className="rsd-detail-card">
        <span>
          {trajectory.name} · {trajectory.code}
        </span>
        <h1>{participant.name}</h1>
        <div className="rsd-detail-facts">
          <div>
            <span>Traject gestart</span>
            <strong>{trajectory.startDate}</strong>
          </div>
          <div>
            <span>Traject afgerond</span>
            <strong>{participant.completed ? "Ja" : "Nee"}</strong>
          </div>
          <div>
            <span>Doelen behaald</span>
            <strong>{participant.goals}</strong>
          </div>
        </div>
        <h2>Voortgang en aanwezigheid</h2>
        <Steps participant={participant} />
        <h2>Uitstroom</h2>
        <p>
          {participant.outcomeStatus === "final"
            ? participant.outcomeCategory
            : "Nog niet afgerond"}
        </p>
        <p>
          {participant.outcomeStatus === "final"
            ? participant.outcomeSummary
            : "Er is nog geen definitief uitstroomadvies beschikbaar."}
        </p>
        <h2>Begin- en eindmeting</h2>
        <p>Scores van 1 (helemaal niet) tot 10 (helemaal wel).</p>
        {participant.startScores ? (
          <div className="rsd-measure-wrap">
            <table className="rsd-measure">
              <thead>
                <tr>
                  <th>Onderwerp</th>
                  <th>Begin</th>
                  <th>Eind</th>
                  <th>Verschil</th>
                </tr>
              </thead>
              <tbody>
                {measurementSubjects.map((subject, index) => {
                  const start = participant.startScores?.[index];
                  const end = participant.endScores?.[index];
                  const difference =
                    start !== undefined && end !== undefined
                      ? end - start
                      : undefined;
                  return (
                    <tr key={subject}>
                      <th scope="row">{subject}</th>
                      <td>{start ?? "—"}</td>
                      <td>{end ?? "—"}</td>
                      <td>
                        {difference === undefined
                          ? "—"
                          : `${difference > 0 ? "+" : ""}${difference}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>De beginmeting is nog niet beschikbaar.</p>
        )}
        {participant.startScores && !participant.endScores && (
          <p>De eindmeting is nog niet beschikbaar.</p>
        )}
      </section>
    </main>
  );
}

function Steps({ participant }: { participant: DashboardParticipant }) {
  const meetings = participant.attendance.filter((present) => present !== null);
  let meetingNumber = 0;
  return (
    <div className="dashboard-progress">
      <div>
        <span>In de app</span>
        <div className="step-dots">
          {participant.appSteps.map((done, index) => (
            <i className={done ? "done" : ""} key={index}>
              {index + 1}
            </i>
          ))}
        </div>
        <strong>{count(participant.appSteps)}/7</strong>
      </div>
      <div>
        <span>Aanwezig</span>
        <div className="step-dots">
          {participant.attendance.map((present, index) => (
            <i
              className={present === null ? "na" : present ? "done" : "missed"}
              key={index}
            >
              {present === null ? "–" : ++meetingNumber}
            </i>
          ))}
        </div>
        <strong>{meetings.filter(Boolean).length}/5</strong>
      </div>
    </div>
  );
}

function RsdOverview({
  trajectory,
  detailUrl,
}: {
  trajectory: DashboardTrajectory;
  detailUrl: (participant: DashboardParticipant) => string;
}) {
  const [status, setStatus] = useState<
    "all" | "completed" | "active" | "not-started"
  >("all");
  const participants = trajectory.participants;
  const started = (participant: DashboardParticipant) =>
    count(participant.appSteps) > 0;
  const visible = participants.filter(
    (participant) =>
      status === "all" ||
      (status === "completed" && participant.completed) ||
      (status === "active" && started(participant) && !participant.completed) ||
      (status === "not-started" && !started(participant)),
  );
  return (
    <section className="rsd-overview">
      <div className="metric-grid" aria-label="Samenvatting traject">
        <article>
          <span>Deelnemers</span>
          <strong>{participants.length}</strong>
        </article>
        <article>
          <span>Gestart</span>
          <strong>{participants.filter(started).length}</strong>
        </article>
        <article>
          <span>Traject afgerond</span>
          <strong>
            {participants.filter((participant) => participant.completed).length}
          </strong>
        </article>
        <article>
          <span>Doelen behaald</span>
          <strong>
            {
              participants.filter((participant) => participant.goals === "Ja")
                .length
            }
          </strong>
        </article>
      </div>
      <div className="rsd-list-heading">
        <div>
          <h2>Deelnemers</h2>
          <p>Voortgang en resultaten van {trajectory.name}</p>
        </div>
        <label>
          Filter op status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="all">Alle statussen</option>
            <option value="completed">Afgerond</option>
            <option value="active">Bezig</option>
            <option value="not-started">Niet gestart</option>
          </select>
        </label>
      </div>
      <div className="participant-table">
        {visible.map((participant) => (
          <article key={participant.id}>
            <div className="participant-name">
              <strong>{participant.name}</strong>
              <span>
                {participant.completed
                  ? "Afgerond"
                  : started(participant)
                    ? "Bezig"
                    : "Niet gestart"}
              </span>
            </div>
            <Steps participant={participant} />
            <div className="rsd-row-result">
              <span>Doelen: {participant.goals}</span>
              <strong>
                {participant.outcomeStatus === "final"
                  ? participant.outcomeCategory
                  : "Uitstroom nog niet bekend"}
              </strong>
              <a
                className="dashboard-detail-link"
                href={detailUrl(participant)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open deelnemer
              </a>
            </div>
          </article>
        ))}
      </div>
      {visible.length === 0 && <p>Geen deelnemers met deze status.</p>}
    </section>
  );
}

function TrajectoryProgress({
  trajectory,
}: {
  trajectory: DashboardTrajectory;
}) {
  const participants = trajectory.participants;
  const total = participants.length;
  const stepTotals = Array.from(
    { length: 7 },
    (_, index) =>
      participants.filter((participant) => participant.appSteps[index]).length,
  );
  const meetingStepIndexes = [0, 1, 3, 5, 6];
  const meetingTotals = meetingStepIndexes.map(
    (stepIndex) =>
      participants.filter(
        (participant) => participant.attendance[stepIndex] === true,
      ).length,
  );
  const startMeasurements = participants.filter(
    (participant) => participant.startScores?.length,
  ).length;
  const endMeasurements = participants.filter(
    (participant) => participant.endScores?.length,
  ).length;
  const provisional = participants.filter(
    (participant) => participant.outcomeStatus === "provisional",
  ).length;
  const final = participants.filter(
    (participant) => participant.outcomeStatus === "final",
  ).length;
  return (
    <section className="trajectory-progress-overview">
      <header>
        <h2>Voortgang van {trajectory.name}</h2>
        <p>Samenvatting van het geselecteerde traject.</p>
      </header>
      <section className="progress-summary-grid">
        <article>
          <span>Deelnemers</span>
          <strong>{total}</strong>
        </article>
        <article>
          <span>Beginmeting afgerond</span>
          <strong>
            {startMeasurements} van {total}
          </strong>
        </article>
        <article>
          <span>Eindmeting afgerond</span>
          <strong>
            {endMeasurements} van {total}
          </strong>
        </article>
        <article>
          <span>Definitief uitstroomadvies</span>
          <strong>
            {final} van {total}
          </strong>
        </article>
      </section>
      <section className="progress-breakdown">
        <h3>Voortgang in de app</h3>
        {stepTotals.map((completed, index) => (
          <div key={index}>
            <span>Stap {index + 1}</span>
            <div className="progress-track">
              <i
                style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
              />
            </div>
            <strong>
              {completed}/{total}
            </strong>
          </div>
        ))}
      </section>
      <section className="progress-breakdown">
        <h3>Aanwezigheid bij bijeenkomsten</h3>
        {meetingTotals.map((present, index) => (
          <div key={index}>
            <span>Bijeenkomst {index + 1}</span>
            <div className="progress-track attendance">
              <i style={{ width: `${total ? (present / total) * 100 : 0}%` }} />
            </div>
            <strong>
              {present}/{total}
            </strong>
          </div>
        ))}
      </section>
      <section className="outcome-overview">
        <h3>Uitstroomadviezen</h3>
        <div>
          <article>
            <span>Nog geen advies</span>
            <strong>{total - provisional - final}</strong>
          </article>
          <article>
            <span>Voorlopig</span>
            <strong>{provisional}</strong>
          </article>
          <article>
            <span>Definitief</span>
            <strong>{final}</strong>
          </article>
        </div>
      </section>
    </section>
  );
}

export function DashboardPortal({
  role,
  repository,
  messageRepository,
  onSignOut,
}: {
  role: Exclude<AppRole, "participant">;
  repository: DashboardRepository;
  messageRepository: StaffMessageRepository;
  onSignOut: () => void;
}) {
  const [trajectories, setTrajectories] = useState<DashboardTrajectory[]>([]);
  const [selected, setSelected] = useState("");
  const [tab, setTab] = useState<
    "users" | "admin" | "appointments" | "overview" | "participants" | "messages" | "results"
  >(role === "project_leader" ? "admin" : "overview");
  const [participantId, setParticipantId] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [outcomeStatus, setOutcomeStatus] = useState<"provisional" | "final">(
    "provisional",
  );
  const [goals, setGoals] = useState<DashboardParticipant["goals"]>(
    "Nog niet bekend",
  );
  const [message, setMessage] = useState("");
  const [participantThreads, setParticipantThreads] = useState<
    StaffMessageThread[]
  >([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (role !== "coach" || !selected) return setUnreadMessages(0);
    messageRepository.list(selected).then(threads => setUnreadMessages(threads.reduce((total, thread) => total + thread.unread, 0))).catch(() => setUnreadMessages(0));
  }, [messageRepository, role, selected]);
  useEffect(() => {
    repository.listTrajectories(role).then((items) => {
      setTrajectories(items);
      setSelected(
        items.find((item) => item.code === rsdTrajectoryCode)?.code ||
          items.find((item) => item.status === "active")?.code ||
          items[0]?.code ||
          "",
      );
    });
  }, [repository, role]);

  useEffect(() => {
    if (role !== "coach" || !selected || !participantId)
      return setParticipantThreads([]);
    messageRepository
      .list(selected)
      .then((threads) =>
        setParticipantThreads(
          threads.filter(
            (thread) =>
              thread.participantId === participantId &&
              thread.status === "open",
          ),
        ),
      );
  }, [messageRepository, participantId, role, selected]);

  const trajectory = trajectories.find((item) => item.code === selected);
  if (!trajectory)
    return <main className="dashboard-loading">Dashboard wordt geladen…</main>;
  const participants = trajectory.participants;
  if (role === "commissioner" && rsdDetailId) {
    const rsdParticipant = participants.find(
      (participant) => participant.id === rsdDetailId,
    );
    return rsdParticipant ? (
      <RsdParticipantPage
        participant={rsdParticipant}
        trajectory={trajectory}
        onSignOut={onSignOut}
      />
    ) : (
      <main className="dashboard-loading">
        Deze deelnemer is niet beschikbaar in dit traject.
      </main>
    );
  }
  const detail = participants.find(
    (participant) => participant.id === participantId,
  );
  const detailUrl = (participant: DashboardParticipant) => {
    const url = new URL(location.href);
    url.searchParams.set("traject", trajectory.code);
    url.searchParams.set("deelnemer", participant.id);
    return url.href;
  };
  const reload = async () =>
    setTrajectories(await repository.listTrajectories(role));
  const selectTrajectory = (code: string) => {
    setSelected(code);
    setParticipantId("");
  };
  const setAttendance = async (index: number, present: boolean) => {
    if (!detail) return;
    const previous = trajectories;
    setTrajectories((current) =>
      current.map((item) =>
        item.code !== trajectory.code
          ? item
          : {
              ...item,
              participants: item.participants.map((participant) => {
                if (participant.id !== detail.id) return participant;
                const attendance = [...participant.attendance];
                attendance[index] = present;
                const appSteps = [...participant.appSteps];
                appSteps[index] = true;
                return { ...participant, attendance, appSteps };
              }),
            },
      ),
    );
    setMessage("Aanwezigheid opslaan…");
    try {
      await repository.updateAttendance(
        trajectory.code,
        detail.id,
        index,
        present,
      );
      setMessage("Aanwezigheid opgeslagen.");
    } catch (error) {
      setTrajectories(previous);
      setMessage(
        error instanceof Error
          ? error.message
          : "De aanwezigheid kon niet worden opgeslagen.",
      );
    }
  };
  const release = async () => {
    if (!detail || !category.trim() || !summary.trim())
      return setMessage("Vul een uitstroomcategorie en samenvatting in.");
    try {
      await repository.releaseOutcome(
        trajectory.code,
        detail.id,
        category,
        summary,
        outcomeStatus,
        goals,
      );
      await reload();
      setMessage(
        outcomeStatus === "final"
          ? "Het definitieve advies is vrijgegeven."
          : "Het voorlopige advies is opgeslagen.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Het uitstroomadvies kon niet worden opgeslagen.",
      );
    }
  };
  const uploadTalentReport = async (file?: File) => {
    if (!detail || !file) return;
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    )
      return setMessage(
        "Kies een pdf-bestand voor het rapport van de talententest.",
      );
    try {
      await repository.uploadParticipantDocument(
        trajectory.code,
        detail.id,
        "talent_report",
        file,
      );
      await reload();
      setMessage("Het rapport van de talententest is toegevoegd.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Het rapport kon niet worden toegevoegd.",
      );
    }
  };
  const releaseTalentResults = async () => {
    if (!detail) return;
    try {
      await repository.releaseTalentResults(trajectory.code, detail.id);
      await reload();
      setMessage("De resultaten zijn vrijgegeven aan de deelnemer.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "De resultaten konden niet worden vrijgegeven.",
      );
    }
  };
  const openCv = (participant: DashboardParticipant) => {
    const cvWindow = window.open("", "_blank");
    if (!cvWindow)
      return setMessage(
        "De browser blokkeert het nieuwe tabblad. Sta pop-ups toe en probeer opnieuw.",
      );
    cvWindow.opener = null;
    const cvAnswers =
      participant.appAnswers?.find((group) => group.step === 3)?.answers || [];
    const groups = [
      ["Over mij", ["Hoe zou je jezelf omschrijven?", "Waar ben je goed in?", "Waar krijg je energie van?"]],
      ["Opleiding", ["School of opleider", "Opleiding of richting", "Status opleiding"]],
      ["Ervaring", ["Bedrijf of organisatie", "Functie of soort ervaring", "Wat deed je daar?"]],
      ["Extra", ["Rijbewijs", "Talen", "Certificaten"]],
    ] as const;
    const renderedQuestions = new Set<string>();
    const renderItems = (questions: readonly string[]) => {
      const items = cvAnswers.filter((item) => questions.includes(item.question));
      items.forEach((item) => renderedQuestions.add(item.question));
      return items.length
        ? items
            .map(
              (item) =>
                `<section class="item"><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.answer)}</p></section>`,
            )
            .join("")
        : "<p>Nog niet ingevuld.</p>";
    };
    const sections = groups
      .map(([title, questions]) => `<h2>${title}</h2>${renderItems(questions)}`)
      .join("");
    const other = cvAnswers.filter(
      (item) =>
        !renderedQuestions.has(item.question) &&
        !["Voor- en achternaam", "Woonplaats", "Leeftijd", "Telefoonnummer", "E-mailadres"].includes(item.question),
    );
    cvWindow.document.write(
      `<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>CV ${escapeHtml(participant.name)}</title><style>body{margin:0;background:#f6f3ed;color:#102832;font-family:Arial,sans-serif}.page{max-width:760px;margin:32px auto;background:#fff;padding:48px;border-radius:18px}h1{font-size:34px;margin:0 0 8px}h2{margin-top:32px;padding-top:16px;border-top:1px solid #102832;color:#f05423;font-size:18px}.contact{color:#5f6f76}.item{margin:18px 0}.item strong{display:block;margin-bottom:5px}.item p,p{color:#5f6f76;line-height:1.55}.item p{margin:0}@media print{body{background:#fff}.page{margin:0;max-width:none}}</style></head><body><main class="page"><h1>${escapeHtml(participant.name)}</h1><p class="contact">${escapeHtml(participant.email || "")}${participant.phone ? ` · ${escapeHtml(participant.phone)}` : ""}</p>${sections}${other.length ? `<h2>Overige informatie</h2>${other.map((item) => `<section class="item"><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.answer)}</p></section>`).join("")}` : ""}</main></body></html>`,
    );
    cvWindow.document.close();
  };
  const open = (participant: DashboardParticipant) => {
    setParticipantId(participant.id);
    setCategory(participant.outcomeCategory || "");
    setSummary(participant.outcomeSummary || "");
    setOutcomeStatus(participant.outcomeStatus || "provisional");
    setGoals(participant.goals);
    setMessage("");
  };

  return (
    <>
      <main
        className={`dashboard-shell ${role === "commissioner" ? "commissioner-shell" : ""}`}
      >
        {role === "commissioner" ? (
          <div className="commissioner-logo-bar">
            <img src={logoUrl} alt="Munks Werkt" />
            <button className="session-logout" onClick={onSignOut}>
              Uitloggen
            </button>
          </div>
        ) : (
          <aside>
            <img src={logoUrl} alt="Munks Werkt" />
            <strong>{labels[role]}</strong>
            <button className="session-logout" onClick={onSignOut}>
              Uitloggen
            </button>
            <nav className={role === "project_leader" ? "admin-nav" : ""}>
              {role === "project_leader" && (
                <button
                  className={tab === "users" ? "active" : ""}
                  onClick={() => setTab("users")}
                >
                  Gebruikers en rollen
                </button>
              )}
              {role === "project_leader" && (
                <button
                  className={tab === "admin" ? "active" : ""}
                  onClick={() => setTab("admin")}
                >
                  Trajecten
                </button>
              )}
              <button
                className={tab === "overview" ? "active" : ""}
                onClick={() => setTab("overview")}
              >
                {role === "coach" ? "Overzicht deelnemers" : "Overzicht"}
              </button>
              {role === "project_leader" && (
                <button
                  className={tab === "participants" ? "active" : ""}
                  onClick={() => setTab("participants")}
                >
                  Deelnemers
                </button>
              )}
              {role === "coach" && (
                <button
                  className={tab === "messages" ? "active" : ""}
                  onClick={() => setTab("messages")}
                >
                  Berichten {unreadMessages > 0 && <i className="nav-badge">{unreadMessages}</i>}
                </button>
              )}
              <button
                className={tab === "appointments" ? "active" : ""}
                onClick={() => setTab("appointments")}
              >
                Afspraken
              </button>
              <button
                className={tab === "results" ? "active" : ""}
                onClick={() => setTab("results")}
              >
                Voortgang
              </button>
            </nav>
          </aside>
        )}
        <section className="dashboard-main">
          {tab !== "users" && (
            <>
              <header
                className={
                  role === "project_leader" ? "admin-dashboard-header" : ""
                }
              >
                {role !== "project_leader" && (
                  <div>
                    {role === "commissioner" && (
                      <span>{trajectory.commissionerName}</span>
                    )}
                    <h1>{labels[role]}</h1>
                  </div>
                )}
                <label
                  className={
                    role === "project_leader"
                      ? "admin-trajectory-selector"
                      : role === "coach"
                        ? "coach-trajectory-selector"
                        : ""
                  }
                >
                  Toon traject
                  <select
                    value={selected}
                    onChange={(event) => selectTrajectory(event.target.value)}
                  >
                    {trajectories.map((item) => (
                        <option value={item.code} key={item.code}>
                          {item.name} · {item.startDate} · {item.status === "active" ? "Actief" : item.status === "planned" ? "Gepland" : "Afgerond"}
                        </option>
                      ))}
                  </select>
                </label>
              </header>
              <div className="trajectory-heading">
                <div>
                  <strong>{trajectory.name}</strong>
                  <span>
                  {trajectory.code} · {trajectory.startDate} t/m{" "}
                    {trajectory.endDate}
                  </span>
                  <span>Opdrachtgever: {trajectory.commissionerName}</span>
                </div>
              </div>
            </>
          )}

          {role === "commissioner" && (
            <RsdOverview trajectory={trajectory} detailUrl={detailUrl} />
          )}
          {tab === "users" && role === "project_leader" && (
            <>
              <UsersRoles trajectories={trajectories} repository={repository} />
              <OrganizationsAdmin repository={repository} />
            </>
          )}
          {tab === "admin" && role === "project_leader" && (
            <DashboardAdmin
              repository={repository}
              trajectories={trajectories}
              selected={selected}
              onSelected={selectTrajectory}
              onChanged={reload}
            />
          )}
          {tab === "appointments" && role !== "commissioner" && (
            <AppointmentsAdmin trajectory={trajectory} repository={repository} />
          )}
          {tab === "overview" && role !== "commissioner" && (
            <div className="metric-grid">
              <article>
                <span>Gestart</span>
                <strong>
                  {
                    participants.filter(
                      (participant) => count(participant.appSteps) > 0,
                    ).length
                  }{" "}
                  van {participants.length}
                </strong>
              </article>
              <article>
                <span>Traject afgerond</span>
                <strong>
                  {
                    participants.filter((participant) => participant.completed)
                      .length
                  }
                </strong>
              </article>
              <article>
                <span>Gemiddelde aanwezigheid</span>
                <strong>
                  {participants.length
                    ? Math.round(
                        (participants.reduce(
                          (sum, participant) =>
                            sum +
                            participant.attendance.filter(Boolean).length / 5,
                          0,
                        ) /
                          participants.length) *
                          100,
                      )
                    : 0}
                  %
                </strong>
              </article>
              <article className="attention">
                <span>Aandacht nodig</span>
                <strong>
                  {
                    participants.filter(
                      (participant) => participant.needsAttention,
                    ).length
                  }
                </strong>
              </article>
            </div>
          )}
          {(tab === "participants" ||
            (role === "coach" && tab === "overview")) &&
            role !== "commissioner" && (
              <section
                className={role === "coach" ? "combined-participants" : ""}
              >
                {role === "coach" && (
                  <header>
                    <h2>Deelnemers</h2>
                    <p>
                      Open een deelnemer om de voortgang, aanwezigheid en
                      antwoorden uit de app te bekijken.
                    </p>
                  </header>
                )}
                <div className="participant-table">
                  {participants.map((participant) => (
                    <article key={participant.id}>
                      <div className="participant-name">
                        <strong>{participant.name}</strong>
                        {participant.needsAttention && (
                          <span>Aandacht nodig</span>
                        )}
                      </div>
                      <Steps participant={participant} />
                      <button onClick={() => open(participant)}>
                        Open deelnemer
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          {tab === "messages" && role === "coach" && (
            <StaffInbox
              repository={messageRepository}
              trajectoryCode={trajectory.code}
              onUnreadChange={setUnreadMessages}
            />
          )}
          {tab === "results" && role !== "commissioner" && (
            <TrajectoryProgress trajectory={trajectory} />
          )}
        </section>
      </main>

      {detail && role !== "commissioner" && (
        <div
          className="dashboard-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Deelnemer ${detail.name}`}
        >
          <section>
            <header>
              <div>
                <span>{trajectory.code}</span>
                <h2>{detail.name}</h2>
              </div>
              <button aria-label="Sluiten" onClick={() => setParticipantId("")}>
                ×
              </button>
            </header>
            <h3>Voortgang</h3>
            <Steps participant={detail} />
            <section className="participant-measurements">
              <h3>Begin- en eindmeting</h3>
              <p>Scores van 1 (helemaal niet) tot 10 (helemaal wel).</p>
              {detail.startScores ? (
                <div className="rsd-measure-wrap">
                  <table className="rsd-measure">
                    <thead>
                      <tr>
                        <th>Onderwerp</th>
                        <th>Begin</th>
                        <th>Eind</th>
                        <th>Verschil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurementSubjects.map((subject, index) => {
                        const start = detail.startScores?.[index];
                        const end = detail.endScores?.[index];
                        const difference =
                          start !== undefined && end !== undefined
                            ? end - start
                            : undefined;
                        return (
                          <tr key={subject}>
                            <th scope="row">{subject}</th>
                            <td>{start ?? "—"}</td>
                            <td>{end ?? "—"}</td>
                            <td>
                              {difference === undefined
                                ? "—"
                                : `${difference > 0 ? "+" : ""}${difference}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>De beginmeting is nog niet beschikbaar.</p>
              )}
              {detail.startScores && !detail.endScores && (
                <p>De eindmeting is nog niet beschikbaar.</p>
              )}
            </section>
            <h3>Aanwezigheid bij bijeenkomsten</h3>
            <div className="attendance-editor">
              {detail.attendance
                .map((present, stepIndex) => ({ present, stepIndex }))
                .filter((item) => item.present !== null)
                .map((item, meetingIndex) => (
                  <div key={item.stepIndex}>
                    <span>Bijeenkomst {meetingIndex + 1}</span>
                    <div>
                      <button
                        className={item.present ? "active" : ""}
                        onClick={() => void setAttendance(item.stepIndex, true)}
                      >
                        Aanwezig
                      </button>
                      <button
                        className={item.present === false ? "missed" : ""}
                        onClick={() =>
                          void setAttendance(item.stepIndex, false)
                        }
                      >
                        Afwezig
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {role === "coach" && (
              <section className="participant-messages">
                <header>
                  <div>
                    <h3>Openstaande berichten</h3>
                    <p>
                      Berichten en hulpvragen die nog niet zijn afgehandeld.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setParticipantId("");
                      setTab("messages");
                    }}
                  >
                    Open berichten
                  </button>
                </header>
                {participantThreads.length ? (
                  <div>
                    {participantThreads.map((thread) => (
                      <article key={thread.id}>
                        <div>
                          <strong>{thread.subject}</strong>
                          <span>
                            {thread.kind === "help_request"
                              ? "Hulpvraag"
                              : "Bericht"}{" "}
                            · {thread.updatedAt}
                          </span>
                        </div>
                        <span className="thread-status">
                          Open{thread.unread ? ` · ${thread.unread} nieuw` : ""}
                        </span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-answers">
                    Deze deelnemer heeft geen openstaande berichten.
                  </p>
                )}
              </section>
            )}
            {role === "coach" && (
              <section className="participant-answers">
                <h3>Antwoorden uit de app</h3>
                <p>
                  Alleen antwoorden van deze deelnemer binnen het geselecteerde
                  traject.
                </p>
                {detail.appAnswers?.length ? (
                  detail.appAnswers.map((group) => (
                    <article key={`${group.step}-${group.title}`}>
                      <header>
                        <span>Stap {group.step}</span>
                        <strong>{group.title}</strong>
                      </header>
                      {group.answers.map((item) => (
                        <div key={item.question}>
                          <span>{item.question}</span>
                          <p>{item.answer}</p>
                        </div>
                      ))}
                    </article>
                  ))
                ) : (
                  <div className="empty-answers">
                    Deze deelnemer heeft nog geen antwoorden ingevuld.
                  </div>
                )}
              </section>
            )}
            {role === "coach" && (
              <section className="participant-documents">
                <h3>Documenten</h3>
                <p>
                  Alleen toegankelijk voor de deelnemer en bevoegde begeleiders
                  binnen dit traject.
                </p>
                <div className="document-list">
                  <article>
                    <div>
                      <strong>Curriculum vitae (cv)</strong>
                      <span>
                        {detail.documents?.find(
                          (document) => document.type === "cv",
                        )?.fileName ||
                          "Cv wordt opgebouwd uit de antwoorden in de app"}
                      </span>
                    </div>
                    <button type="button" onClick={() => openCv(detail)}>
                      Bekijk cv
                    </button>
                  </article>
                  <article>
                    <div>
                      <strong>Rapport talententest</strong>
                      <span>
                        {detail.documents?.find(
                          (document) => document.type === "talent_report",
                        )?.fileName || "Nog geen rapport geüpload"}
                      </span>
                      {detail.documents?.find(
                        (document) => document.type === "talent_report",
                      ) && (
                        <small>
                          Geüpload op{" "}
                          {
                            detail.documents.find(
                              (document) => document.type === "talent_report",
                            )?.uploadedAt
                          }
                        </small>
                      )}
                    </div>
                    <div className="document-actions">
                      {detail.documents?.find(
                        (document) => document.type === "talent_report",
                      ) && (
                        <button
                          type="button"
                          onClick={() =>
                            void repository
                              .openParticipantDocument(
                                detail.documents!.find(
                                  (document) =>
                                    document.type === "talent_report",
                                )!,
                              )
                              .catch((error) =>
                                setMessage(
                                  error instanceof Error
                                    ? error.message
                                    : "Het rapport kon niet worden geopend.",
                                ),
                              )
                          }
                        >
                          Open rapport
                        </button>
                      )}
                      <label className="document-upload">
                        {detail.documents?.some(
                          (document) => document.type === "talent_report",
                        )
                          ? "Rapport vervangen"
                          : "Rapport uploaden"}
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(event) =>
                            void uploadTalentReport(event.target.files?.[0])
                          }
                        />
                      </label>
                      {detail.talentStatus !== "released" &&
                        detail.documents?.some(
                          (document) => document.type === "talent_report",
                        ) && (
                        <button
                          type="button"
                          onClick={() => void releaseTalentResults()}
                        >
                          Resultaten vrijgeven
                        </button>
                      )}
                      {detail.talentStatus === "released" && (
                        <span>Resultaten vrijgegeven</span>
                      )}
                    </div>
                  </article>
                </div>
              </section>
            )}
            <h3>Uitstroomadvies</h3>
            <label>
              Status advies
              <select
                value={outcomeStatus}
                onChange={(event) =>
                  setOutcomeStatus(
                    event.target.value as "provisional" | "final",
                  )
                }
              >
                <option value="provisional">Voorlopig uitstroomadvies</option>
                <option value="final">Definitief uitstroomadvies</option>
              </select>
            </label>
            <label>
              Doelen behaald
              <select
                value={goals}
                onChange={(event) =>
                  setGoals(event.target.value as DashboardParticipant["goals"])
                }
              >
                <option>Nog niet bekend</option>
                <option>Ja</option>
                <option>Deels</option>
                <option>Nee</option>
              </select>
            </label>
            <label>
              Uitstroomcategorie
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </label>
            <label>
              Samenvatting
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
            <button className="release-button" onClick={() => void release()}>
              {outcomeStatus === "final"
                ? "Definitief advies vrijgeven"
                : "Voorlopig advies opslaan"}
            </button>
            {message && <p className="dashboard-message">{message}</p>}
            <button
              className="close-button"
              onClick={() => setParticipantId("")}
            >
              Terug naar dashboard
            </button>
          </section>
        </div>
      )}
    </>
  );
}
