import { useEffect, useState } from "react";
import type { AnswerRepository } from "./domain";
import { downloadCvAsWord } from "./cvWordDocument";
import { openAiAssistant } from "./aiNavigation";
import { saveErrorMessage } from "./saveError";

type CvData = Record<string, string>;
const formerExampleDetails: CvData = {
  name: "Sam de Jong",
  city: "Zeist",
  age: "20",
  phone: "06 12345678",
  email: "sam@voorbeeld.nl",
};
const parts = [
  {
    id: "s3-details",
    heading: "Jouw gegevens",
    title: "Kloppen jouw gegevens?",
    help: "Controleer je gegevens. Je naam en e-mailadres kan alleen de beheerder wijzigen; andere gegevens kun je hier voor je cv aanvullen of aanpassen.",
    skippable: false,
    fields: [
      ["name", "Voor- en achternaam"],
      ["city", "Woonplaats"],
      ["age", "Leeftijd"],
      ["phone", "Telefoonnummer"],
      ["email", "E-mailadres"],
    ],
  },
  {
    id: "s3-about",
    heading: "Dit ben ik",
    title: "Vertel iets over jezelf",
    help: "Met een paar korte antwoorden maken we straks een persoonlijke tekst voor je cv.",
    skippable: false,
    fields: [
      ["description", "Hoe zou je jezelf omschrijven?"],
      ["strengths", "Waar ben je goed in?"],
      ["energy", "Wat vind je leuk en waar krijg je energie van?"],
    ],
  },
  {
    id: "s3-education",
    heading: "Opleiding en leren",
    title: "Voeg je opleiding toe",
    help: "Ook een opleiding die je niet hebt afgerond kan op je cv.",
    skippable: true,
    fields: [
      ["school", "School of opleider"],
      ["education", "Naam van de opleiding of richting"],
      ["educationStatus", "Status van de opleiding"],
    ],
  },
  {
    id: "s3-experience",
    heading: "Mijn ervaring",
    title: "Voeg je ervaring toe",
    help: "Werk, een bijbaan, stage en vrijwilligerswerk kunnen allemaal op je cv.",
    skippable: true,
    fields: [
      ["organization", "Bedrijf of organisatie"],
      ["experienceType", "Functie of soort ervaring"],
      ["experienceDescription", "Wat deed je daar?"],
    ],
  },
  {
    id: "s3-extra",
    heading: "Extra informatie",
    title: "Wil je nog iets toevoegen?",
    help: "Dit onderdeel is niet verplicht. Vul alleen in wat voor jou van toepassing is.",
    skippable: true,
    fields: [
      ["drivingLicense", "Rijbewijs"],
      ["languages", "Talen"],
      ["certificates", "Certificaten"],
    ],
  },
] as const;

const Eye = () => (
  <svg className="eye-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.75" />
  </svg>
);

export function StepThreeFlow({
  repository,
  participantId,
  trajectoryCode,
  personalDetails,
  onClose,
  onComplete,
}: {
  repository: AnswerRepository;
  participantId: string;
  trajectoryCode: string;
  personalDetails?: { name: string; city: string; age: string; phone: string; email: string };
  onClose: () => void;
  onComplete: () => Promise<void>;
}) {
  const [stage, setStage] = useState<"intro" | "parts" | "preview">("intro");
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<CvData>(() => ({ ...personalDetails }));
  const [loadedFor, setLoadedFor] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadRevision, setLoadRevision] = useState(0);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [moving, setMoving] = useState(false);
  const [educationCount, setEducationCount] = useState(1);
  const [experienceCount, setExperienceCount] = useState(1);
  const part = parts[index];
  const educationFields = Array.from(
    { length: educationCount - 1 },
    (_, item) => {
      const number = item + 2;
      return [
        [`school${number}`, `School of opleider ${number}`],
        [`education${number}`, `Naam van opleiding of richting ${number}`],
        [`educationStatus${number}`, `Status van opleiding ${number}`],
      ] as const;
    },
  ).flat();
  const experienceFields = Array.from(
    { length: experienceCount - 1 },
    (_, item) => {
      const number = item + 2;
      return [
        [`organization${number}`, `Bedrijf of organisatie ${number}`],
        [`experienceType${number}`, `Functie of soort ervaring ${number}`],
        [`experienceDescription${number}`, `Wat deed je daar?`],
      ] as const;
    },
  ).flat();
  const activeFields: readonly (readonly [string, string])[] =
    part.id === "s3-education"
      ? [...part.fields, ...educationFields]
      : part.id === "s3-experience"
        ? [...part.fields, ...experienceFields]
        : part.fields;
  const partData = () =>
    Object.fromEntries(activeFields.map(([key]) => [key, data[key] || ""]));

  useEffect(() => {
    if (stage !== "parts") return;
    let active = true;
    setLoadedFor("");
    setLoadError("");
    repository.get(participantId, trajectoryCode, part.id).then((answer) => {
      if (!active) return;
      const saved = answer?.value;
      if (saved && typeof saved === "object" && !Array.isArray(saved))
        setData((current) => ({
          ...current,
          ...Object.fromEntries(
            Object.entries(saved).map(([key, value]) => {
              const text = String(value);
              return [key, part.id === "s3-details" && formerExampleDetails[key] === text
                ? personalDetails?.[key as keyof typeof personalDetails] ?? ""
                : text];
            }),
          ),
          ...(part.id === "s3-details" ? { name: personalDetails?.name ?? "", email: personalDetails?.email ?? "" } : {}),
        }));
      setLoadedFor(part.id);
    }).catch(() => { if (active) setLoadError("Dit cv-onderdeel kon niet worden geladen."); });
    return () => {
      active = false;
    };
  }, [index, loadRevision, part.id, participantId, personalDetails, repository, stage, trajectoryCode]);
  useEffect(() => {
    if (stage !== "parts" || loadedFor !== part.id) return;
    setSaveState("saving");
    const timer = window.setTimeout(
      () =>
        repository
          .save({
            participantId,
            trajectoryCode,
            activityId: part.id,
            value: partData(),
            updatedAt: new Date().toISOString(),
          })
          .then(() => setSaveState("saved"))
          .catch((reason) => { setSaveError(saveErrorMessage(reason)); setSaveState("error"); }),
      450,
    );
    return () => window.clearTimeout(timer);
  }, [data, loadedFor, part.id, participantId, repository, stage, trajectoryCode]);

  const move = async (direction: 1 | -1) => {
    if (moving) return;
    setMoving(true);
    try {
      await repository.save({
        participantId,
        trajectoryCode,
        activityId: part.id,
        value: partData(),
        updatedAt: new Date().toISOString(),
      });
      setSaveState("saved");
      if (direction === 1 && index === parts.length - 1) {
        await onComplete();
        setStage("preview");
      } else setIndex((current) => current + direction);
    } catch (reason) {
      setSaveError(saveErrorMessage(reason));
      setSaveState("error");
    } finally {
      setMoving(false);
    }
  };
  const skip = async () => {
    if (moving) return;
    setMoving(true);
    const cleared = { ...data };
    activeFields.forEach(([key]) => delete cleared[key]);
    setData(cleared);
    try {
      await repository.save({
        participantId,
        trajectoryCode,
        activityId: part.id,
        value: {},
        updatedAt: new Date().toISOString(),
      });
      if (index === parts.length - 1) {
        await onComplete();
        setStage("preview");
      } else setIndex((current) => current + 1);
    } catch (reason) {
      setSaveError(saveErrorMessage(reason));
      setSaveState("error");
    } finally {
      setMoving(false);
    }
  };
  const introduction =
    [data.description, data.strengths, data.energy].filter(Boolean).join(" ") ||
    "Nog niet ingevuld";
  const educationSummary = Array.from({ length: educationCount }, (_, item) => {
    const suffix = item === 0 ? "" : String(item + 1);
    return [
      data[`school${suffix}`],
      data[`education${suffix}`],
      data[`educationStatus${suffix}`],
    ]
      .filter(Boolean)
      .join(" · ");
  }).filter(Boolean);
  const experienceSummary = Array.from(
    { length: experienceCount },
    (_, item) => {
      const suffix = item === 0 ? "" : String(item + 1);
      return [
        data[`organization${suffix}`],
        data[`experienceType${suffix}`],
        data[`experienceDescription${suffix}`],
      ]
        .filter(Boolean)
        .join(" · ");
    },
  ).filter(Boolean);
  const download = async () => {
    setMessage("");
    try {
      await downloadCvAsWord(data);
    } catch (error) {
      console.error("Word-download mislukt", error);
      setMessage(
        "Het Word-bestand kon niet worden gemaakt. Ververs de pagina en probeer het opnieuw.",
      );
    }
  };

  if (stage === "intro")
    return (
      <section className="step-flow">
        <span className="eyebrow">Stap 3 · Maak je cv</span>
        <h1>Maak jouw cv</h1>
        <p>Je interesses, opleiding en ervaring kunnen allemaal op je cv.</p>
        <section className="flow-card">
          <h2>We doen dit in zes onderdelen</h2>
          <ol className="numbered-info">
            <li>Jouw gegevens</li>
            <li>Dit ben ik</li>
            <li>Opleiding en leren</li>
            <li>Mijn ervaring</li>
            <li>Extra informatie</li>
            <li>Bekijk jouw cv</li>
          </ol>
          <div className="visibility-note">
            <Eye />
            <span>Alleen jij en de begeleiders kunnen deze gegevens zien.</span>
          </div>
        </section>
        <button className="flow-primary" onClick={() => setStage("parts")}>
          Begin met mijn cv
        </button>
        <button className="flow-secondary" onClick={onClose}>
          Terug naar mijn route
        </button>
      </section>
    );
  if (stage === "preview")
    return (
      <section className="step-flow">
        <span className="eyebrow">Stap 3 · Onderdeel 6 van 6</span>
        <h1>Bekijk jouw cv</h1>
        <p>Controleer rustig of alles klopt.</p>
        <section className="flow-card cv-preview">
          <h2>{data.name || "Jouw naam"}</h2>
          <div className="cv-lines">
            {data.city && <p>{data.city}</p>}
            {data.age && <p>{data.age} jaar</p>}
            {data.phone && <p>{data.phone}</p>}
            {data.email && <p>{data.email}</p>}
          </div>
          <h3>Over mij</h3>
          <div className="cv-entry-list">
            {data.description && (
              <section className="cv-entry">
                <p>
                  <strong>Hoe zou je jezelf omschrijven?</strong>
                  <br />
                  {data.description}
                </p>
              </section>
            )}
            {data.strengths && (
              <section className="cv-entry">
                <p>
                  <strong>Waar ben je goed in?</strong>
                  <br />
                  {data.strengths}
                </p>
              </section>
            )}
            {data.energy && (
              <section className="cv-entry">
                <p>
                  <strong>
                    Wat vind je leuk en waar krijg je energie van?
                  </strong>
                  <br />
                  {data.energy}
                </p>
              </section>
            )}
            {![data.description, data.strengths, data.energy].some(Boolean) && (
              <p>Nog niet ingevuld</p>
            )}
          </div>
          <h3>Opleiding</h3>
          <div className="cv-entry-list">
            {Array.from({ length: educationCount }, (_, item) => {
              const suffix = item === 0 ? "" : String(item + 1);
              const values = [
                data[`school${suffix}`],
                data[`education${suffix}`],
                data[`educationStatus${suffix}`],
              ];
              return values.some(Boolean) ? (
                <section className="cv-entry" key={`education-${item}`}>
                  <p>
                    <strong>School of opleider</strong>
                    <br />
                    {values[0] || "Niet ingevuld"}
                  </p>
                  <p>
                    <strong>Opleiding of richting</strong>
                    <br />
                    {values[1] || "Niet ingevuld"}
                  </p>
                  <p>
                    <strong>Status</strong>
                    <br />
                    {values[2] || "Niet ingevuld"}
                  </p>
                </section>
              ) : null;
            })}
            {educationSummary.length === 0 && <p>Nog niet ingevuld</p>}
          </div>
          <h3>Ervaring</h3>
          <div className="cv-entry-list">
            {Array.from({ length: experienceCount }, (_, item) => {
              const suffix = item === 0 ? "" : String(item + 1);
              const values = [
                data[`organization${suffix}`],
                data[`experienceType${suffix}`],
                data[`experienceDescription${suffix}`],
              ];
              return values.some(Boolean) ? (
                <section className="cv-entry" key={`experience-${item}`}>
                  <p>
                    <strong>Bedrijf of organisatie</strong>
                    <br />
                    {values[0] || "Niet ingevuld"}
                  </p>
                  <p>
                    <strong>Functie of soort ervaring</strong>
                    <br />
                    {values[1] || "Niet ingevuld"}
                  </p>
                  <p>
                    <strong>Wat deed je daar?</strong>
                    <br />
                    {values[2] || "Niet ingevuld"}
                  </p>
                </section>
              ) : null;
            })}
            {experienceSummary.length === 0 && <p>Nog niet ingevuld</p>}
          </div>
          <h3>Extra</h3>
          <div className="cv-entry-list">
            {data.drivingLicense && (
              <section className="cv-entry">
                <p>
                  <strong>Rijbewijs</strong>
                  <br />
                  {data.drivingLicense}
                </p>
              </section>
            )}
            {data.languages && (
              <section className="cv-entry">
                <p>
                  <strong>Talen</strong>
                  <br />
                  {data.languages}
                </p>
              </section>
            )}
            {data.certificates && (
              <section className="cv-entry">
                <p>
                  <strong>Certificaten</strong>
                  <br />
                  {data.certificates}
                </p>
              </section>
            )}
            {![data.drivingLicense, data.languages, data.certificates].some(
              Boolean,
            ) && <p>Nog niet ingevuld</p>}
          </div>
          <div className="visibility-note">
            <Eye />
            <span>Alleen jij en de begeleiders kunnen jouw cv zien.</span>
          </div>
        </section>
        <button className="flow-primary" onClick={download}>
          Download mijn cv
        </button>
        <button
          className="flow-secondary"
          onClick={() => openAiAssistant("Geef mij eenvoudige tips om mijn cv duidelijker en sterker te maken. Vraag welk onderdeel ik wil verbeteren.")}
        >
          Laat de AI-assistent meekijken
        </button>
        {message && <p className="notice-box">{message}</p>}
        <button
          className="flow-secondary"
          onClick={() => {
            setIndex(0);
            setStage("parts");
          }}
        >
          Gegevens aanpassen
        </button>
        <button className="flow-secondary" onClick={onClose}>
          Terug naar mijn route
        </button>
      </section>
    );
  if (loadedFor !== part.id) return (
    <section className="step-flow">
      <span className="eyebrow">Stap 3 · Onderdeel {index + 1} van 6</span>
      <h1>{part.heading}</h1>
      <section className="flow-card" role="status">{loadError || "Antwoord laden…"}</section>
      {loadError && <button className="flow-primary" onClick={() => setLoadRevision(current => current + 1)}>Opnieuw proberen</button>}
      <button className="flow-secondary" onClick={onClose}>Terug naar mijn route</button>
    </section>
  );
  return (
    <section className="step-flow">
      <span className="eyebrow">Stap 3 · Onderdeel {index + 1} van 6</span>
      <h1>{part.heading}</h1>
      <p>{part.help}</p>
      <section className="flow-card cv-form">
        <span className="question-count">Jouw cv</span>
        <h2>{part.title}</h2>
        {activeFields.map(([key, label]) => (
          <label key={key}>
            {label}
            {["description", "strengths", "energy"].includes(key) ||
            key.startsWith("experienceDescription") ? (
              <textarea
                value={data[key] || ""}
                onChange={(event) =>
                  setData((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            ) : (
              <input
                type={
                  key === "age"
                    ? "number"
                    : key === "email"
                      ? "email"
                      : key === "phone"
                        ? "tel"
                        : "text"
                }
                value={data[key] || ""}
                readOnly={part.id === "s3-details" && (key === "name" || key === "email")}
                onChange={(event) =>
                  setData((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            )}
          </label>
        ))}
        {part.id === "s3-education" && (
          <button
            type="button"
            className="add-cv-item"
            onClick={() => setEducationCount((count) => count + 1)}
          >
            + Nog een opleiding toevoegen
          </button>
        )}
        {part.id === "s3-experience" && (
          <button
            type="button"
            className="add-cv-item"
            onClick={() => setExperienceCount((count) => count + 1)}
          >
            + Nog een ervaring toevoegen
          </button>
        )}
        <div className="visibility-note">
          <Eye />
          <span>Alleen jij en de begeleiders kunnen deze gegevens zien.</span>
        </div>
        <div className={`save-state ${saveState}`}>
          {
            {
              idle: "",
              saving: "Opslaan…",
              saved: "Automatisch opgeslagen",
              error: saveError,
            }[saveState]
          }
        </div>
      </section>
      <button className="flow-primary" disabled={moving} onClick={() => void move(1)}>
        {moving ? "Even opslaan…" : index === parts.length - 1
          ? "Opslaan en bekijk mijn cv"
          : "Opslaan en verder"}
      </button>
      {part.skippable && (
        <button className="flow-link" disabled={moving} onClick={() => void skip()}>
          Dit onderdeel overslaan
        </button>
      )}
      <button
        className="flow-secondary"
        onClick={() => (index === 0 ? setStage("intro") : void move(-1))}
      >
        {index === 0 ? "Terug naar uitleg" : "Vorig onderdeel"}
      </button>
    </section>
  );
}
