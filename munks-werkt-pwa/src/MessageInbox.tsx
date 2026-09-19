import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { MessageRepository, MessageThread } from './domain';

export function MessageInbox({ repository, onUnreadChange }: { repository: MessageRepository; onUnreadChange?: (count: number) => void }) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selected, setSelected] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [accountBlocked, setAccountBlocked] = useState(false);
  const thread = threads.find(item => item.id === selected);
  const reload = async () => {
    const items = await repository.list();
    setThreads(items);
    onUnreadChange?.(items.reduce((total, item) => total + item.unread, 0));
  };
  useEffect(() => { void reload(); }, [repository]);

  const open = async (id: string) => { setSelected(id); await repository.markRead(id); await reload(); };
  const reply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get('body') || '').trim();
    if (!thread || !body) return;
    try { setError(''); await repository.reply(thread.id, body); form.reset(); await reload(); } catch (reason) { const message = reason instanceof Error ? reason.message : 'Versturen is niet gelukt.'; setError(message); if (message.includes('account is niet actief')) setAccountBlocked(true); }
  };
  const start = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const subject = String(data.get('subject') || '').trim();
    const body = String(data.get('body') || '').trim();
    if (!subject || !body) return;
    try {
      setError('');
      const id = await repository.start('help_request', subject, body);
      form.reset(); setCreating(false); await reload(); setSelected(id);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Versturen is niet gelukt.';
      setError(message);
      if (message.includes('account is niet actief')) setAccountBlocked(true);
    }
  };

  if (creating) return <section className="screen message-screen"><span className="eyebrow">Contact</span><h1>Nieuwe hulpvraag</h1><p>Vertel kort waarbij je hulp wilt. Je begeleider antwoordt je uiterlijk binnen twee werkdagen.</p>{error&&<p className="auth-error" role="alert">{error}</p>}<form className="message-form" onSubmit={start}><label>Waar gaat je vraag over?<input name="subject" required maxLength={120} disabled={accountBlocked}/></label><label>Jouw bericht<textarea name="body" required maxLength={5000} disabled={accountBlocked}/></label><button className="flow-primary" disabled={accountBlocked}>Verstuur mijn vraag</button><button type="button" className="flow-secondary" onClick={() => setCreating(false)}>Annuleren</button></form></section>;
  if (thread) return <section className="screen message-screen"><button className="message-back" onClick={() => setSelected('')}>← Alle berichten</button><span className="eyebrow">Gesprek met {thread.coachName}</span><h1>{thread.subject}</h1><div className="message-thread">{thread.messages.map(message => <article className={message.sender} key={message.id}><strong>{message.senderName}</strong><p>{message.body}</p><small>{message.sentAt}</small></article>)}</div>{error&&<p className="auth-error" role="alert">{error}</p>}{thread.messages.some(message => message.sender === 'coach') ? <form className="message-reply" onSubmit={reply}><label>Jouw antwoord<textarea name="body" required maxLength={5000} disabled={accountBlocked}/></label><button className="flow-primary" disabled={accountBlocked}>Verstuur antwoord</button></form> : <p className="notice-box">Je begeleider kan hier antwoorden. Daarna kun je zelf een vervolgbericht sturen.</p>}</section>;
  return <section className="screen message-screen"><span className="eyebrow">Contact</span><h1>Berichten</h1><p>Hier vind je de berichten van je begeleider en jouw hulpvragen.</p><button className="flow-primary" onClick={() => setCreating(true)}>Nieuwe hulpvraag</button><div className="message-list">{threads.map(item => <button onClick={() => void open(item.id)} key={item.id}><div><strong>{item.subject}</strong><span>{item.coachName} · {item.updatedAt}</span></div><p>{item.messages.at(-1)?.body}</p>{item.unread > 0 && <i>{item.unread}</i>}</button>)}</div>{threads.length === 0 && <p className="notice-box">Je hebt nog geen berichten.</p>}</section>;
}
