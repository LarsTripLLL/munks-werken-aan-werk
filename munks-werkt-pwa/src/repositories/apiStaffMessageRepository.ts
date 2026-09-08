import type { StaffMessageRepository, StaffMessageThread } from '../domain';
import { ApiClient } from './apiClient';

export class ApiStaffMessageRepository implements StaffMessageRepository {
  constructor(private readonly api = new ApiClient()) {}
  list(trajectoryCode: string) { return this.api.request<StaffMessageThread[]>(`/coach/trajectories/${encodeURIComponent(trajectoryCode)}/messages`); }
  reply(threadId: string, body: string) { return this.api.request<void>(`/coach/messages/${encodeURIComponent(threadId)}/replies`, { method: 'POST', body: JSON.stringify({ body }) }); }
  markRead(threadId: string) { return this.api.request<void>(`/coach/messages/${encodeURIComponent(threadId)}/read`, { method: 'POST' }); }
  markHandled(threadId: string) { return this.api.request<void>(`/coach/messages/${encodeURIComponent(threadId)}/handled`, { method: 'POST' }); }
}
