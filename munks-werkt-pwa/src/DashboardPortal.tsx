import { useEffect, useState } from 'react';
import type { AppRole, DashboardParticipant, DashboardRepository, DashboardTrajectory, StaffMessageRepository } from './domain';
import { DashboardAdmin } from './DashboardAdmin';
import { StaffInbox } from './StaffInbox';
import logoUrl from '../../pilot-app/assets/Munks-Werkt-logo.png';

const labels = {
  coach: 'Begeleidersdashboard',
  project_leader: 'Projectleidersdashboard',
  commissioner: 'Opdrachtgeversdashboard',
} as const;

const count = (values: boolean[]) => values.filter(Boolean).length;

function Steps({ participant }: { participant: DashboardParticipant }) {
  return <div className="dashboard-progress">
    <div><span>In de app</span><div className="step-dots">{participant.appSteps.map((done, index) => <i className={done ? 'done' : ''} key={index}>{index + 1}</i>)}</div><strong>{count(participant.appSteps)}/7</strong></div>
    <div><span>Aanwezig</span><div className="step-dots">{participant.attendance.map((present, index) => <i className={present === null ? 'na' : present ? 'done' : 'missed'} key={index}>{present === null ? '–' : index + 1}</i>)}</div><strong>{participant.attendance.filter(Boolean).length}/5</strong></div>
  </div>;
}

export function DashboardPortal({ role, repository, messageRepository }: { role: Exclude<AppRole, 'participant'>; repository: DashboardRepository; messageRepository: StaffMessageRepository }) {
  const [trajectories, setTrajectories] = useState<DashboardTrajectory[]>([]);
  const [selected, setSelected] = useState('');
  const [tab, setTab] = useState<'admin' | 'overview' | 'participants' | 'messages' | 'results'>(role === 'project_leader' ? 'admin' : 'overview');
  const [participantId, setParticipantId] = useState('');
  const [category, setCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    repository.listTrajectories(role).then(items => {
      setTrajectories(items);
      setSelected(items[0]?.code || '');
    });
  }, [repository, role]);

  const trajectory = trajectories.find(item => item.code === selected);
  if (!trajectory) return <main className="dashboard-loading">Dashboard wordt geladen…</main>;
  const participants = trajectory.participants;
  const detail = participants.find(participant => participant.id === participantId);
  const reload = async () => setTrajectories(await repository.listTrajectories(role));
  const selectTrajectory = (code: string) => { setSelected(code); setParticipantId(''); };
  const setAttendance = async (index: number, present: boolean) => {
    if (!detail) return;
    await repository.updateAttendance(trajectory.code, detail.id, index, present);
    await reload();
  };
  const release = async () => {
    if (!detail || !category.trim() || !summary.trim()) return setMessage('Vul een uitstroomcategorie en samenvatting in.');
    await repository.releaseOutcome(trajectory.code, detail.id, category, summary);
    await reload();
    setMessage('Het definitieve advies is vrijgegeven.');
  };
  const open = (participant: DashboardParticipant) => {
    setParticipantId(participant.id);
    setCategory(participant.outcomeCategory || '');
    setSummary(participant.outcomeSummary || '');
    setMessage('');
  };

  return <>
    <main className="dashboard-shell">
      <aside>
        <img src={logoUrl} alt="Munks Werkt" />
        <strong>{labels[role]}</strong>
        <nav>
          {role === 'project_leader' && <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>Trajecten en deelnemers</button>}
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overzicht</button>
          <button className={tab === 'participants' ? 'active' : ''} onClick={() => setTab('participants')}>Deelnemers</button>
          {role === 'coach' && <button className={tab === 'messages' ? 'active' : ''} onClick={() => setTab('messages')}>Berichten</button>}
          <button className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}>{role === 'commissioner' ? 'Resultaten' : 'Voortgang'}</button>
        </nav>
      </aside>
      <section className="dashboard-main">
        <header>
          <div><span>{trajectory.commissionerName}</span><h1>{labels[role]}</h1></div>
          <label>Toon traject<select value={selected} onChange={event => selectTrajectory(event.target.value)}>{trajectories.filter(item => item.status === 'active').map(item => <option value={item.code} key={item.code}>{item.name} · {item.startDate}</option>)}</select></label>
        </header>
        <div className="trajectory-heading"><div><strong>{trajectory.name}</strong><span>{trajectory.code} · {trajectory.startDate} t/m {trajectory.endDate}</span></div></div>

        {tab === 'admin' && role === 'project_leader' && <DashboardAdmin repository={repository} trajectories={trajectories} selected={selected} onSelected={selectTrajectory} onChanged={reload} />}
        {tab === 'overview' && <div className="metric-grid">
          <article><span>Gestart</span><strong>{participants.filter(participant => count(participant.appSteps) > 0).length} van {participants.length}</strong></article>
          <article><span>Traject afgerond</span><strong>{participants.filter(participant => participant.completed).length}</strong></article>
          <article><span>Gemiddelde aanwezigheid</span><strong>{participants.length ? Math.round(participants.reduce((sum, participant) => sum + participant.attendance.filter(Boolean).length / 5, 0) / participants.length * 100) : 0}%</strong></article>
          <article className="attention"><span>Aandacht nodig</span><strong>{participants.filter(participant => participant.needsAttention).length}</strong></article>
        </div>}
        {tab === 'participants' && <div className="participant-table">{participants.map(participant => <article key={participant.id}>
          <div className="participant-name"><strong>{participant.name}</strong>{participant.needsAttention && <span>Aandacht nodig</span>}</div>
          <Steps participant={participant} />
          {role !== 'commissioner' && <button onClick={() => open(participant)}>Open deelnemer</button>}
        </article>)}</div>}
        {tab === 'messages' && role === 'coach' && <StaffInbox repository={messageRepository} trajectoryCode={trajectory.code}/>} 
        {tab === 'results' && <div className="participant-table">{participants.map(participant => <article key={participant.id}>
          <div className="participant-name"><strong>{participant.name}</strong><span>Doelen behaald: {participant.goals}</span></div>
          <Steps participant={participant} />
          {role === 'commissioner'
            ? <div className="result-summary"><strong>{participant.outcomeCategory || 'Nog niet afgerond'}</strong><p>{participant.outcomeSummary || 'Er is nog geen definitief uitstroomadvies beschikbaar.'}</p>{participant.startScores && <small>Beginmeting beschikbaar{participant.endScores ? ' · Eindmeting beschikbaar' : ' · Eindmeting nog niet beschikbaar'}</small>}</div>
            : <button onClick={() => open(participant)}>Bekijk voortgang</button>}
        </article>)}</div>}
      </section>
    </main>

    {detail && role !== 'commissioner' && <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Deelnemer ${detail.name}`}>
      <section>
        <header><div><span>{trajectory.code}</span><h2>{detail.name}</h2></div><button aria-label="Sluiten" onClick={() => setParticipantId('')}>×</button></header>
        <h3>Voortgang</h3><Steps participant={detail} />
        <h3>Aanwezigheid bij bijeenkomsten</h3>
        <div className="attendance-editor">{detail.attendance.map((present, index) => <div key={index}><span>Stap {index + 1}</span>{present === null ? <strong>Niet van toepassing</strong> : <div><button className={present ? 'active' : ''} onClick={() => void setAttendance(index, true)}>Aanwezig</button><button className={present === false ? 'missed' : ''} onClick={() => void setAttendance(index, false)}>Afwezig</button></div>}</div>)}</div>
        <h3>Definitief uitstroomadvies</h3>
        <label>Uitstroomcategorie<input value={category} onChange={event => setCategory(event.target.value)} /></label>
        <label>Samenvatting<textarea value={summary} onChange={event => setSummary(event.target.value)} /></label>
        <button className="release-button" onClick={() => void release()}>Advies vrijgeven</button>
        {message && <p className="dashboard-message">{message}</p>}
        <button className="close-button" onClick={() => setParticipantId('')}>Terug naar dashboard</button>
      </section>
    </div>}
  </>;
}
