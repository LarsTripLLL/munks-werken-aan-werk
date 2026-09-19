import type { AppRole, DashboardAppointment, DashboardManagementOptions, DashboardParticipant, DashboardRepository, DashboardTrajectory, ManagedUser, ParticipantDocument } from '../domain';

type DashboardResponse = { dashboardTrajectories?: DashboardTrajectory[]; dashboardManagementOptions?: DashboardManagementOptions };

export class SupabaseDashboardRepository implements DashboardRepository {
  constructor(private readonly supabaseUrl: string, private readonly publishableKey: string) {}

  async listTrajectories(_role: Exclude<AppRole, 'participant'>): Promise<DashboardTrajectory[]> {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, { headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('De trajectgegevens konden niet worden geladen.');
    return ((await response.json()) as DashboardResponse).dashboardTrajectories ?? [];
  }
  async listManagementOptions(): Promise<DashboardManagementOptions> {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, { headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('De beheeropties konden niet worden geladen.');
    return ((await response.json()) as DashboardResponse).dashboardManagementOptions ?? { coaches: [], commissioners: [] };
  }
  async saveManagedUser(user:ManagedUser):Promise<void>{const token=localStorage.getItem('munks-werkt-access-token');if(!token)throw new Error('Aanmelden is vereist.');const response=await fetch(`${this.supabaseUrl}/functions/v1/session-api`,{method:'POST',headers:{apikey:this.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'save_managed_user',managedUser:user})});if(!response.ok){const problem=await response.json().catch(()=>({})) as {message?:string};throw new Error(problem.message||'De gebruiker kon niet worden opgeslagen.')}}
  async saveCommissioner(organization:{code:string;name:string;active:boolean}):Promise<void>{const token=localStorage.getItem('munks-werkt-access-token');if(!token)throw new Error('Aanmelden is vereist.');const response=await fetch(`${this.supabaseUrl}/functions/v1/session-api`,{method:'POST',headers:{apikey:this.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'save_commissioner',organization})});if(!response.ok){const problem=await response.json().catch(()=>({})) as {message?:string};throw new Error(problem.message||'De opdrachtgever kon niet worden opgeslagen.')}}
  async listAppointments(trajectoryCode:string):Promise<DashboardAppointment[]>{const token=localStorage.getItem('munks-werkt-access-token');if(!token)throw new Error('Aanmelden is vereist.');const response=await fetch(`${this.supabaseUrl}/functions/v1/session-api?appointments=${encodeURIComponent(trajectoryCode)}`,{headers:{apikey:this.publishableKey,Authorization:`Bearer ${token}`}});const result=await response.json().catch(()=>({})) as {message?:string;dashboardAppointments?:DashboardAppointment[]};if(!response.ok)throw new Error(result.message||'De afspraken konden niet worden geladen.');return result.dashboardAppointments??[]}
  async saveAppointment(appointment:Omit<DashboardAppointment,'coachName'|'cancelled'>):Promise<void>{const token=localStorage.getItem('munks-werkt-access-token');if(!token)throw new Error('Aanmelden is vereist.');const response=await fetch(`${this.supabaseUrl}/functions/v1/session-api`,{method:'POST',headers:{apikey:this.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'save_appointment',appointment})});if(!response.ok){const problem=await response.json().catch(()=>({})) as {message?:string};throw new Error(problem.message||'De afspraak kon niet worden opgeslagen.')}}
  async setAppointmentActive(appointmentId:string,active:boolean):Promise<void>{const token=localStorage.getItem('munks-werkt-access-token');if(!token)throw new Error('Aanmelden is vereist.');const response=await fetch(`${this.supabaseUrl}/functions/v1/session-api`,{method:'POST',headers:{apikey:this.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'set_appointment_active',appointmentId,active})});if(!response.ok){const problem=await response.json().catch(()=>({})) as {message?:string};throw new Error(problem.message||'De afspraakstatus kon niet worden gewijzigd.')}}

  async updateAttendance(_trajectoryCode: string, participantId: string, stepIndex: number, present: boolean): Promise<void> {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      method: 'POST',
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_attendance', enrollmentId: participantId, stepNumber: stepIndex + 1, present }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(problem.message || 'De aanwezigheid kon niet worden opgeslagen.');
    }
  }
  async releaseOutcome(trajectoryCode: string, participantId: string, category: string, summary: string, status: 'provisional' | 'final', goals: DashboardParticipant['goals']): Promise<void> {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      method: 'POST',
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'release_outcome', trajectoryCode, enrollmentId: participantId, category, summary, status, goals: ({ Ja: 'yes', Deels: 'partial', Nee: 'no', 'Nog niet bekend': 'not_assessed' } as const)[goals] }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(problem.message || 'Het uitstroomadvies kon niet worden opgeslagen.');
    }
  }
  async createTrajectory(input: Pick<DashboardTrajectory, 'code' | 'name' | 'commissionerName' | 'startDate' | 'endDate' | 'coaches'>): Promise<void> { await this.saveTrajectory('create_trajectory', input.code, input); }
  async updateTrajectory(code: string, input: Pick<DashboardTrajectory, 'name' | 'commissionerName' | 'startDate' | 'endDate' | 'coaches'>): Promise<void> { await this.saveTrajectory('update_trajectory', code, input); }
  private async saveTrajectory(action: 'create_trajectory' | 'update_trajectory', code: string, input: Pick<DashboardTrajectory, 'name' | 'commissionerName' | 'startDate' | 'endDate' | 'coaches'>): Promise<void> {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, { method: 'POST', headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, code, ...input, coachIds: input.coaches.map(coach => coach.id) }) });
    if (!response.ok) { const problem = await response.json().catch(() => ({})) as { message?: string }; throw new Error(problem.message || 'Het traject kon niet worden opgeslagen.'); }
  }
  async addParticipant(trajectoryCode: string, input: Pick<DashboardParticipant, 'name' | 'email' | 'phone' | 'city' | 'age' | 'coachId'>): Promise<{ activationCode: string }> { return this.saveParticipant('create_participant', trajectoryCode, undefined, input) as Promise<{ activationCode: string }>; }
  async updateParticipant(trajectoryCode: string, participantId: string, input: Pick<DashboardParticipant, 'name' | 'email' | 'phone' | 'city' | 'age' | 'coachId' | 'active'>): Promise<void> { await this.saveParticipant('update_participant', trajectoryCode, participantId, input); }
  async renewParticipantActivation(trajectoryCode: string, participantId: string): Promise<{ activationCode: string }> { return this.saveParticipant('renew_participant_activation', trajectoryCode, participantId, {name:'-',email:'-',phone:'',coachId:'-'}) as Promise<{ activationCode: string }>; }
  private async saveParticipant(action: 'create_participant' | 'update_participant' | 'renew_participant_activation', trajectoryCode: string, enrollmentId: string | undefined, input: Pick<DashboardParticipant, 'name' | 'email' | 'phone' | 'coachId'> & { city?: string; age?: number; active?: boolean }): Promise<void | { activationCode: string }> {
    const token = localStorage.getItem('munks-werkt-access-token'); if (!token) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {method:'POST',headers:{apikey:this.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action,trajectoryCode,enrollmentId,...input})});
    const result = await response.json().catch(()=>({})) as {message?:string;activationCode?:string}; if(!response.ok)throw new Error(result.message||'De deelnemer kon niet worden opgeslagen.');
    return result.activationCode ? {activationCode:result.activationCode} : undefined;
  }
  async uploadParticipantDocument(trajectoryCode: string, participantId: string, type: 'cv' | 'talent_report', file: File): Promise<void> {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    if (type !== 'talent_report' || file.type !== 'application/pdf') throw new Error('Kies een pdf-bestand van de talententest.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Het bestand mag maximaal 10 MB zijn.');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const storagePath = `${participantId}/talent_report/${Date.now()}-${safeName}`;
    const upload = await fetch(`${this.supabaseUrl}/storage/v1/object/participant-documents/${storagePath}`, {
      method: 'POST',
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': file.type, 'x-upsert': 'false' },
      body: file,
    });
    if (!upload.ok) {
      const problem = await upload.json().catch(() => ({})) as { message?: string };
      throw new Error(problem.message || 'Het rapport kon niet worden geüpload.');
    }
    const register = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      method: 'POST',
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register_document', trajectoryCode, enrollmentId: participantId, documentType: type, displayName: file.name, storagePath, mimeType: file.type, fileSize: file.size }),
    });
    if (!register.ok) {
      const problem = await register.json().catch(() => ({})) as { message?: string };
      throw new Error(problem.message || 'Het rapport is geüpload, maar kon niet worden geregistreerd.');
    }
  }
  async openParticipantDocument(document: ParticipantDocument): Promise<void> {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    if (!document.storagePath) throw new Error('Het bestand is niet beschikbaar.');
    const response = await fetch(`${this.supabaseUrl}/storage/v1/object/authenticated/participant-documents/${document.storagePath}`, {
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Het rapport kon niet veilig worden geopend.');
    const url = URL.createObjectURL(await response.blob());
    const link = window.document.createElement('a');
    link.href = url; link.target = '_blank'; link.rel = 'noopener';
    window.document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async releaseTalentResults(trajectoryCode: string, participantId: string): Promise<void> {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      method: 'POST',
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'release_talent_results', trajectoryCode, enrollmentId: participantId }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(problem.message || 'De resultaten konden niet worden vrijgegeven.');
    }
  }
}
