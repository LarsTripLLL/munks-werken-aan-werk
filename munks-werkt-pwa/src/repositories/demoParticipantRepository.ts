import type { ParticipantHome, ParticipantRepository } from '../domain';

const demoHome: ParticipantHome = {
  user: { id: 'demo-participant', displayName: 'Sam', role: 'participant', organizationId: 'demo-rsd' },
  trajectoryCode: 'MW-RSD-001',
  currentStep: 3,
  currentTitle: 'Maak je cv',
  appointment: { dateLabel: 'Maandag 12 mei', timeLabel: '10.00 – 11.00 uur', coachName: 'Brita' },
  unreadMessages: 1,
  steps: [
    { number: 1, title: 'Kennismaken', status: 'completed' },
    { number: 2, title: 'Talententest en resultaten', status: 'completed' },
    { number: 3, title: 'Maak je cv', status: 'current' },
    { number: 4, title: 'Bespreek je cv', status: 'available' },
    { number: 5, title: 'Werk zoeken en reageren', status: 'locked' },
    { number: 6, title: 'Een gesprek voorbereiden', status: 'locked' },
    { number: 7, title: 'Mogelijkheden en afronding', status: 'locked' },
  ],
};

export class DemoParticipantRepository implements ParticipantRepository {
  async getHome(signal?: AbortSignal): Promise<ParticipantHome> {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 180);
      signal?.addEventListener('abort', () => {
        window.clearTimeout(timer);
        reject(new DOMException('Afgebroken', 'AbortError'));
      }, { once: true });
    });
    return structuredClone(demoHome);
  }
}
