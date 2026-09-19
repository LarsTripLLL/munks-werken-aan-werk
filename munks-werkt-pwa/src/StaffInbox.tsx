import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { StaffMessageRepository, StaffMessageThread } from './domain';

export function StaffInbox({ repository, trajectoryCode, onUnreadChange }: { repository: StaffMessageRepository; trajectoryCode: string; onUnreadChange?: (count: number) => void }) {
  const [threads, setThreads] = useState<StaffMessageThread[]>([]);
  const [selected, setSelected] = useState('');
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [error, setError] = useState('');
  const [accountBlocked, setAccountBlocked] = useState(false);
  const thread = threads.find(item => item.id === selected);
  const reload = async () => {
    const items = await repository.list(trajectoryCode);
    setThreads(items);
    onUnreadChange?.(items.reduce((total, item) => total + item.unread, 0));
  };
  useEffect(() => { setSelected(''); void reload(); }, [repository, trajectoryCode]);
  const shown = filter === 'all' ? threads : threads.filter(item => item.status === 'open');
  const showError = (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : 'Deze actie is niet gelukt.';
    setError(message);
    if (message.includes('account is niet actief')) setAccountBlocked(true);
  };
  const open = async (id: string) => {
    setSelected(id);
    setError('');
    try { await repository.markRead(id); await reload(); } catch (reason) { showError(reason); }
  };
  const reply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const body = String(new FormData(form).get('body') || '').trim();
    if (!thread || !body) return;
    setError('');
    try { await repository.reply(thread.id, body); form.reset(); await reload(); } catch (reason) { showError(reason); }
  };
  const handled = async () => {
    if (!thread) return;
    setError('');
    try { await repository.markHandled(thread.id); await reload(); setSelected(''); } catch (reason) { showError(reason); }
  };

  if (thread) return <section className="staff-inbox"><button className="message-back" onClick={() => setSelected('')}>← Terug naar inbox</button><header><div><span>{thread.participantName}</span><h2>{thread.subject}</h2></div><span className={`thread-status ${thread.status}`}>{thread.status === 'open' ? 'Open' : 'Afgehandeld'}</span></header><div className="staff-thread">{thread.messages.map(message => <article className={message.sender} key={message.id}><strong>{message.senderName}</strong><p>{message.body}</p><small>{message.sentAt}</small></article>)}</div>{error&&<p className="auth-error" role="alert">{error}</p>}<form className="staff-reply" onSubmit={reply}><label>Antwoord<textarea name="body" required maxLength={5000} disabled={accountBlocked}/></label><div><button className="release-button" disabled={accountBlocked}>Verstuur antwoord</button>{thread.status !== 'handled' && <button type="button" className="close-button" disabled={accountBlocked} onClick={() => void handled()}>Markeer als afgehandeld</button>}</div></form></section>;

  return <section className="staff-inbox"><header><div><h2>Berichten en hulpvragen</h2><p>Persoonlijke gesprekken van deelnemers binnen het gekozen traject.</p></div><div className="inbox-filter"><button className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}>Open</button><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Alle berichten</button></div></header><div className="staff-thread-list">{shown.map(item => <button onClick={() => void open(item.id)} key={item.id}><div><strong>{item.participantName}</strong><span>{item.kind === 'help_request' ? 'Hulpvraag' : 'Bericht'} · {item.updatedAt}</span></div><span className={`thread-status ${item.status}`}>{item.status === 'open' ? 'Open' : 'Afgehandeld'}</span><h3>{item.subject}</h3><p>{item.messages.at(-1)?.body}</p>{item.unread > 0 && <i>{item.unread}</i>}</button>)}</div>{shown.length === 0 && <p className="notice-box">Er zijn geen openstaande berichten.</p>}</section>;
}
