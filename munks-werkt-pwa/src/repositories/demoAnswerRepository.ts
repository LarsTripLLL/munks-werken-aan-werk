import type { AnswerRepository, ParticipantAnswer } from '../domain';

export class DemoAnswerRepository implements AnswerRepository {
  private readonly answers = new Map<string, ParticipantAnswer>();

  private key(answer: Pick<ParticipantAnswer, 'participantId' | 'trajectoryCode' | 'activityId'>) {
    return `${answer.participantId}:${answer.trajectoryCode}:${answer.activityId}`;
  }

  async save(answer: ParticipantAnswer) {
    this.answers.set(this.key(answer), structuredClone(answer));
  }

  async get(participantId: string, trajectoryCode: string, activityId: string) {
    const answer = this.answers.get(this.key({ participantId, trajectoryCode, activityId }));
    return answer ? structuredClone(answer) : undefined;
  }
}
