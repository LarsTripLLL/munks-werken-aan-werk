import type { MessageRepository, MessageThread } from '../domain';
import { ApiClient } from './apiClient';

export class ApiMessageRepository implements MessageRepository {
  constructor(private readonly api = new ApiClient()) {}
  list() { return this.api.request<MessageThread[]>('/participant/messages'); }
  async start(kind: MessageThread['kind'], subject: string, body: string) {
    const result = await this.api.request<{ id: string }>('/participant/messages', { method: 'POST', body: JSON.stringify({ kind, subject, body }) });
    return result.id;
  }
  reply(threadId: string, body: string) { return this.api.request<void>(`/participant/messages/${encodeURIComponent(threadId)}/replies`, { method: 'POST', body: JSON.stringify({ body }) }); }
  markRead(threadId: string) { return this.api.request<void>(`/participant/messages/${encodeURIComponent(threadId)}/read`, { method: 'POST' }); }
}
