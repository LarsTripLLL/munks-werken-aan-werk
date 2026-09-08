import type { MessageRepository, MessageThread } from '../domain';

let sequence = 10;
const threads: MessageThread[] = [{
  id: 'thread-1',
  kind: 'message',
  subject: 'Voorbereiding kennismaking',
  status: 'open',
  coachName: 'Brita',
  updatedAt: 'Vandaag · 10:14',
  unread: 1,
  messages: [
    { id: 'message-1', sender: 'coach', senderName: 'Brita', body: 'Hoi Sam, lukt het met de voorbereiding voor de kennismaking?', sentAt: 'Vandaag · 10:14', read: false },
  ],
}];

export class DemoMessageRepository implements MessageRepository {
  async list() { return structuredClone(threads); }
  async start(kind: MessageThread['kind'], subject: string, body: string) {
    const id = `thread-${++sequence}`;
    threads.unshift({ id, kind, subject, status: 'open', coachName: 'Brita', updatedAt: 'Zojuist', unread: 0, messages: [{ id: `message-${++sequence}`, sender: 'participant', senderName: 'Jij', body, sentAt: 'Zojuist', read: true }] });
    return id;
  }
  async reply(threadId: string, body: string) {
    const thread = threads.find(item => item.id === threadId);
    if (!thread || thread.status === 'closed') throw new Error('Dit gesprek kan niet worden geopend.');
    thread.messages.push({ id: `message-${++sequence}`, sender: 'participant', senderName: 'Jij', body, sentAt: 'Zojuist', read: true });
    thread.updatedAt = 'Zojuist';
    thread.status = 'open';
  }
  async markRead(threadId: string) {
    const thread = threads.find(item => item.id === threadId);
    if (!thread) return;
    thread.unread = 0;
    thread.messages.forEach(message => { if (message.sender === 'coach') message.read = true; });
  }
}
