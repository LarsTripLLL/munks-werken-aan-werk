import type { StaffMessageRepository, StaffMessageThread } from '../domain';

let sequence = 50;
const threads: StaffMessageThread[] = [
  {
    id: 'staff-thread-1', kind: 'help_request', subject: 'Hulp met mijn cv', status: 'open', coachName: 'Brita', participantId: 'p1', participantName: 'Sam de Jong', trajectoryCode: 'MW-RSD-001', updatedAt: 'Vandaag · 11:20', unread: 1,
    messages: [{ id: 'staff-message-1', sender: 'participant', senderName: 'Sam', body: 'Ik weet niet goed wat ik bij mijn ervaring kan invullen. Kun je mij helpen?', sentAt: 'Vandaag · 11:20', read: false }],
  },
  {
    id: 'staff-thread-3', kind: 'help_request', subject: 'Vraag over een opleiding', status: 'open', coachName: 'Brita', participantId: 'p2', participantName: 'Noor Bakker', trajectoryCode: 'MW-RSD-001', updatedAt: 'Vandaag · 09:45', unread: 1,
    messages: [{ id: 'staff-message-3', sender: 'participant', senderName: 'Noor', body: 'Ik heb een opleiding gevonden, maar ik weet niet zeker of het niveau bij mij past. Kunnen we hier samen naar kijken?', sentAt: 'Vandaag · 09:45', read: false }],
  },
  {
    id: 'staff-thread-2', kind: 'message', subject: 'Afspraak donderdag', status: 'handled', coachName: 'Brita', participantId: 'p2', participantName: 'Noor El Amrani', trajectoryCode: 'MW-RSD-001', updatedAt: 'Gisteren · 15:05', unread: 0,
    messages: [{ id: 'staff-message-2', sender: 'coach', senderName: 'Brita', body: 'De afspraak staat donderdag om 10.00 uur. Tot dan!', sentAt: 'Gisteren · 15:05', read: true }],
  },
];

export class DemoStaffMessageRepository implements StaffMessageRepository {
  async list(trajectoryCode: string) { return structuredClone(threads.filter(thread => thread.trajectoryCode === trajectoryCode)); }
  async reply(threadId: string, body: string) {
    const thread = threads.find(item => item.id === threadId);
    if (!thread) throw new Error('Het gesprek is niet gevonden.');
    thread.messages.push({ id: `staff-message-${++sequence}`, sender: 'coach', senderName: thread.coachName, body, sentAt: 'Zojuist', read: true });
    thread.updatedAt = 'Zojuist'; thread.status = 'open';
  }
  async markRead(threadId: string) {
    const thread = threads.find(item => item.id === threadId);
    if (!thread) return;
    thread.unread = 0; thread.messages.forEach(message => { if (message.sender === 'participant') message.read = true; });
  }
  async markHandled(threadId: string) {
    const thread = threads.find(item => item.id === threadId);
    if (thread) thread.status = 'handled';
  }
}
