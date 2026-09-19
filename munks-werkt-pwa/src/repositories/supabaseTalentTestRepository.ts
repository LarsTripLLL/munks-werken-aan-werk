import type { TalentTestRepository, TalentTestStatus } from '../domain';

export class SupabaseTalentTestRepository implements TalentTestRepository {
  constructor(private readonly supabaseUrl: string, private readonly publishableKey: string) {}

  private async request(body: Record<string, unknown>) {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      method: 'POST',
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(problem.message || 'De status van de talententest kon niet worden verwerkt.');
    }
    return response.json() as Promise<{ status?: TalentTestStatus }>;
  }

  async getStatus(_participantId: string, trajectoryCode: string): Promise<TalentTestStatus> {
    return (await this.request({ action: 'get_talent_status', trajectoryCode })).status ?? 'not_started';
  }
  async recordConsent(_participantId: string, trajectoryCode: string, choice: 'accepted' | 'discuss'): Promise<void> {
    await this.request({ action: 'record_talent_consent', trajectoryCode, choice });
  }
  async markCompleted(): Promise<void> { throw new Error('De test wordt als afgerond geregistreerd zodra de begeleider het rapport uploadt.'); }
  async releaseResults(): Promise<void> { throw new Error('Alleen de begeleider kan de besproken resultaten vrijgeven.'); }
}
