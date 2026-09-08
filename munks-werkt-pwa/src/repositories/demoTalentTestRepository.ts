import type { TalentTestRepository, TalentTestStatus } from '../domain';

export class DemoTalentTestRepository implements TalentTestRepository {
  private status: TalentTestStatus = 'not_started';
  private consent: 'accepted' | 'discuss' | undefined;

  async getStatus() { return this.status; }
  async recordConsent(_participantId: string, _trajectoryCode: string, choice: 'accepted' | 'discuss') { this.consent = choice; }
  async markCompleted() { if (this.consent !== 'accepted') throw new Error('Leg eerst vast dat de deelnemer akkoord gaat.'); this.status = 'completed'; }
  async releaseResults() { if (this.status !== 'completed') throw new Error('De test moet eerst zijn afgerond.'); this.status = 'released'; }
}
