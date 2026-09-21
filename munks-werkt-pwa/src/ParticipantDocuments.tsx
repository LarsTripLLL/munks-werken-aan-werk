import { useEffect, useState } from 'react';
import type { AnswerRepository, ParticipantDocument, ParticipantDocumentRepository, ParticipantHome } from './domain';
import { downloadCvAsWord, type CvData } from './cvWordDocument';

const cvActivities = ['s3-details', 's3-about', 's3-education', 's3-experience', 's3-extra'];

export function ParticipantDocuments({ repository, answerRepository, participantId, trajectoryCode, personalDetails }: { repository: ParticipantDocumentRepository; answerRepository: AnswerRepository; participantId: string; trajectoryCode: string; personalDetails?: ParticipantHome['personalDetails'] }) {
  const [documents, setDocuments] = useState<ParticipantDocument[]>([]);
  const [message, setMessage] = useState('Documenten laden…');

  useEffect(() => {
    let active = true;
    repository.list().then(items => {
      if (!active) return;
      setDocuments(items);
      setMessage('');
    }).catch(error => active && setMessage(error instanceof Error ? error.message : 'De documenten konden niet worden geladen.'));
    return () => { active = false; };
  }, [repository]);

  const open = async (document: ParticipantDocument) => {
    setMessage('');
    try { await repository.open(document); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Het document kon niet worden geopend.'); }
  };

  const downloadCv = async () => {
    setMessage('Word-bestand maken…');
    try {
      const answers = await Promise.all(cvActivities.map(activityId => answerRepository.get(participantId, trajectoryCode, activityId)));
      const cv: CvData = {};
      answers.forEach(answer => {
        if (answer?.value && typeof answer.value === 'object' && !Array.isArray(answer.value)) {
          Object.entries(answer.value).forEach(([key, value]) => { cv[key] = String(value); });
        }
      });
      if (personalDetails) {
        cv.name = personalDetails.name;
        cv.age = personalDetails.age;
        cv.email = personalDetails.email;
      }
      if (!Object.values(cv).some(value => value.trim())) throw new Error('Je hebt nog geen cv-gegevens ingevuld.');
      await downloadCvAsWord(cv);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Het cv kon niet worden gemaakt.');
    }
  };

  return <section className="screen"><span className="eyebrow">Jouw bestanden</span><h1>Mijn documenten</h1><p>Bekijk de documenten die tijdens jouw traject beschikbaar zijn.</p><article className="participant-document-list"><h2>Documenten</h2><div><div><strong>Mijn cv</strong><span>Bewerkbaar Word-bestand op basis van jouw ingevulde gegevens</span></div><button type="button" onClick={() => void downloadCv()}>Download cv</button></div>{documents.filter(document => document.type !== 'cv').map(document => <div key={`${document.type}-${document.storagePath}`}><div><strong>Rapport talententest</strong><span>{document.fileName}</span><small>Toegevoegd op {document.uploadedAt}</small></div><button type="button" onClick={() => void open(document)}>Open rapport</button></div>)}{message && <p className="notice-box">{message}</p>}</article></section>;
}
