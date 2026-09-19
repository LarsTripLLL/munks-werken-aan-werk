import type { ParticipantHome, ParticipantRepository, StepStatus } from '../domain';

type SessionHomeResponse = {
  user: { id: string; displayName: string };
  participantHome: {
    personalDetails?: { name: string; city: string; age: string; phone: string; email: string };
    trajectoryCode: string;
    trajectoryName?: string;
    trajectoryStatus?: 'active' | 'planned' | 'completed';
    currentStep: number;
    currentTitle: string;
    steps: Array<{ number: number; title: string; status: StepStatus }>;
    appointments?: Array<{id:string;stepNumber?:number;title:string;date:string;startTime:string;endTime:string;coachName:string;location?:string;explanation?:string}>;
    outcome?: { category: string; summary: string; status: 'provisional' | 'final' };
  } | null;
};

export class SupabaseParticipantRepository implements ParticipantRepository {
  constructor(
    private readonly supabaseUrl: string,
    private readonly publishableKey: string,
  ) {}

  async getHome(signal?: AbortSignal): Promise<ParticipantHome> {
    const accessToken = localStorage.getItem('munks-werkt-access-token');
    if (!accessToken) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      signal,
      headers: {
        apikey: this.publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) throw new Error('De voortgang kon niet veilig worden geladen.');
    const session = await response.json() as SessionHomeResponse;
    if (!session.participantHome) throw new Error('Aan dit account is geen actief traject gekoppeld.');
    let unreadMessages = 0;
    try {
      const messagesResponse = await fetch(`${this.supabaseUrl}/rest/v1/rpc/list_my_message_threads`, { method: 'POST', headers: { apikey: this.publishableKey, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: '{}' });
      if (messagesResponse.ok) unreadMessages = ((await messagesResponse.json()) as Array<{ unread?: number }>).reduce((total, thread) => total + Number(thread.unread ?? 0), 0);
    } catch { /* Het laden van de startpagina mag niet afhangen van de berichtenlijst. */ }

    const appointments=(session.participantHome.appointments??[]).map(item=>({id:item.id,stepNumber:item.stepNumber,title:item.title,dateLabel:new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(new Date(`${item.date}T12:00:00`)),timeLabel:`${item.startTime} – ${item.endTime} uur`,coachName:item.coachName,location:item.location,explanation:item.explanation}));
    return {
      user: {
        id: session.user.id,
        displayName: session.user.displayName,
        role: 'participant',
        organizationId: session.participantHome.trajectoryCode,
      },
      personalDetails: session.participantHome.personalDetails,
      trajectoryCode: session.participantHome.trajectoryCode,
      trajectoryName: session.participantHome.trajectoryName,
      trajectoryStatus: session.participantHome.trajectoryStatus,
      currentStep: session.participantHome.currentStep,
      currentTitle: session.participantHome.currentTitle,
      steps: session.participantHome.steps,
      appointment: appointments[0]??{ dateLabel: 'Nog geen afspraak gepland', timeLabel: '', coachName: '' },
      appointments,
      unreadMessages,
      outcome: session.participantHome.outcome,
    };
  }
}
