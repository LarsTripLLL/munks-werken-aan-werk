import type { ProgressRepository } from '../domain';

export class SupabaseProgressRepository implements ProgressRepository {
  constructor(
    private readonly supabaseUrl: string,
    private readonly publishableKey: string,
  ) {}

  async completeStep(stepNumber: number): Promise<void> {
    const accessToken = localStorage.getItem('munks-werkt-access-token');
    if (!accessToken) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      method: 'POST',
      headers: {
        apikey: this.publishableKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'complete_step', stepNumber }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(problem.message || 'De stap kon niet worden afgerond.');
    }
  }
}
