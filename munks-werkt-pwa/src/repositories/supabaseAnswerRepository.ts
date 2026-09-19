import type { AnswerRepository, ParticipantAnswer } from '../domain';

type AnswerResponse = {
  answer: null | {
    value: ParticipantAnswer['value'];
    updatedAt: string;
  };
};

export class SupabaseAnswerRepository implements AnswerRepository {
  constructor(
    private readonly supabaseUrl: string,
    private readonly publishableKey: string,
  ) {}

  private async request<T>(body: Record<string, unknown>): Promise<T> {
    const accessToken = localStorage.getItem('munks-werkt-access-token');
    if (!accessToken) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      method: 'POST',
      headers: {
        apikey: this.publishableKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(problem.message || 'Het antwoord kon niet veilig worden verwerkt.');
    }
    return response.json() as Promise<T>;
  }

  async save(answer: ParticipantAnswer): Promise<void> {
    await this.request({
      action: 'save_answer',
      trajectoryCode: answer.trajectoryCode,
      activityId: answer.activityId,
      value: answer.value,
    });
  }

  async get(participantId: string, trajectoryCode: string, activityId: string) {
    const result = await this.request<AnswerResponse>({
      action: 'get_answer',
      trajectoryCode,
      activityId,
    });
    return result.answer ? {
      participantId,
      trajectoryCode,
      activityId,
      value: result.answer.value,
      updatedAt: result.answer.updatedAt,
    } : undefined;
  }
}
