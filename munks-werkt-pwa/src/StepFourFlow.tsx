import { useState } from 'react';
import type { AnswerRepository } from './domain';

type CvData = Record<string, string>;
const cvActivities = ['s3-details','s3-about','s3-education','s3-experience','s3-extra'];
const Eye = () => <svg className="eye-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.75"/></svg>;

export function StepFourFlow({ repository, participantId, trajectoryCode, onEdit, onClose }: { repository:AnswerRepository; participantId:string; trajectoryCode:string; onEdit:()=>void; onClose:()=>void }) {
  const [showCv,setShowCv]=useState(false);
  const [data,setData]=useState<CvData>({});
  const [loading,setLoading]=useState(false);

  const loadCv=async()=>{setLoading(true);const answers=await Promise.all(cvActivities.map(activityId=>repository.get(participantId,trajectoryCode,activityId)));const merged:CvData={};answers.forEach(answer=>{if(answer?.value&&typeof answer.value==='object'&&!Array.isArray(answer.value))Object.entries(answer.value).forEach(([key,value])=>merged[key]=String(value))});setData(merged);setLoading(false);setShowCv(true)};
  const introduction=[data.description,data.strengths,data.energy].filter(Boolean).join(' ')||'Nog niet ingevuld';

  if(showCv)return <section className="step-flow"><span className="eyebrow">Stap 4 · Bespreek je cv</span><h1>Jouw cv</h1><p>Bekijk je cv rustig voordat je het in de groep bespreekt.</p><section className="flow-card cv-preview"><h2>{data.name||'Jouw naam'}</h2><p>{[data.city,data.age&&`${data.age} jaar`,data.phone,data.email].filter(Boolean).join(' · ')||'Nog geen gegevens ingevuld'}</p><h3>Over mij</h3><p>{introduction}</p><h3>Opleiding</h3><p>{[data.education,data.school,data.educationStatus].filter(Boolean).join(' · ')||'Nog niet ingevuld'}</p><h3>Ervaring</h3><p>{[data.experienceType,data.organization,data.experienceDescription].filter(Boolean).join(' · ')||'Nog niet ingevuld'}</p><h3>Extra</h3><p>{[data.drivingLicense,data.languages,data.certificates].filter(Boolean).join(' · ')||'Nog niet ingevuld'}</p><div className="visibility-note"><Eye/><span>Alleen jij en de begeleiders kunnen jouw cv in de app zien.</span></div></section><button className="flow-primary" onClick={onEdit}>Mijn cv aanpassen</button><button className="flow-secondary" onClick={()=>setShowCv(false)}>Terug naar de bijeenkomst</button></section>;

  return <section className="step-flow"><span className="eyebrow">Stap 4 · Bespreek je cv</span><h1>Samen naar je cv kijken</h1><p>Je cv is klaar om tijdens de groepsbijeenkomst te bespreken.</p><section className="flow-card"><p>Tijdens de groepsbijeenkomst bekijken jullie de cv’s en krijg je tips waarmee je jouw cv sterker kunt maken.</p><div className="meeting-list"><article><span>1</span><div><strong>Bekijk je cv vooraf</strong><p>Controleer nog één keer of alles klopt.</p></div></article><article><span><Eye/></span><div><strong>Jij kiest wat je bespreekt</strong><p>Je bepaalt zelf wat je tijdens de bijeenkomst wilt laten zien.</p></div></article><article><span>3</span><div><strong>Verwerk de tips</strong><p>Na de bijeenkomst kun je jouw cv nog aanpassen.</p></div></article></div><div className="visibility-note"><Eye/><span>Je cv wordt niet automatisch met de groep gedeeld.</span></div></section><button className="flow-primary" disabled={loading} onClick={()=>void loadCv()}>{loading?'Cv laden…':'Bekijk mijn cv'}</button><button className="flow-secondary" onClick={onEdit}>Mijn cv aanpassen</button><button className="flow-secondary" onClick={onClose}>Terug naar mijn route</button><p className="attendance-note">Je begeleider registreert na de bijeenkomst je aanwezigheid.</p></section>;
}
