import type { AppRole, DashboardParticipant, DashboardRepository, DashboardTrajectory, ParticipantDocument } from '../domain';
import { ApiClient } from './apiClient';

export class ApiDashboardRepository implements DashboardRepository {
  constructor(private readonly api = new ApiClient()) {}

  listTrajectories(_role: Exclude<AppRole, 'participant'>) {
    return this.api.request<DashboardTrajectory[]>('/dashboard/trajectories');
  }

  listManagementOptions() { return this.api.request<import('../domain').DashboardManagementOptions>('/dashboard/management-options'); }
  saveManagedUser(user:import('../domain').ManagedUser){return this.api.request<void>('/dashboard/users',{method:'POST',body:JSON.stringify(user)})}
  saveCommissioner(organization:{code:string;name:string;active:boolean}){return this.api.request<void>('/dashboard/commissioners',{method:'POST',body:JSON.stringify(organization)})}
  listAppointments(trajectoryCode:string){return this.api.request<import('../domain').DashboardAppointment[]>(`/dashboard/trajectories/${encodeURIComponent(trajectoryCode)}/appointments`)}
  saveAppointment(appointment:Omit<import('../domain').DashboardAppointment,'coachName'|'cancelled'>){return this.api.request<void>('/dashboard/appointments',{method:'POST',body:JSON.stringify(appointment)})}
  setAppointmentActive(appointmentId:string,active:boolean){return this.api.request<void>(`/dashboard/appointments/${encodeURIComponent(appointmentId)}/status`,{method:'POST',body:JSON.stringify({active})})}

  updateAttendance(trajectoryCode: string, participantId: string, stepIndex: number, present: boolean) {
    return this.api.request<void>(`/dashboard/trajectories/${encodeURIComponent(trajectoryCode)}/participants/${encodeURIComponent(participantId)}/attendance`, { method: 'PATCH', body: JSON.stringify({ stepIndex, present }) });
  }

  releaseOutcome(trajectoryCode: string, participantId: string, category: string, summary: string, status: 'provisional' | 'final', goals: DashboardParticipant['goals']) {
    return this.api.request<void>(`/dashboard/trajectories/${encodeURIComponent(trajectoryCode)}/participants/${encodeURIComponent(participantId)}/outcome`, { method: 'PATCH', body: JSON.stringify({ category, summary, status, goals }) });
  }

  createTrajectory(input: Pick<DashboardTrajectory, 'code' | 'name' | 'commissionerName' | 'startDate' | 'endDate' | 'coaches'>) {
    return this.api.request<void>('/dashboard/trajectories', { method: 'POST', body: JSON.stringify(input) });
  }

  updateTrajectory(code: string, input: Pick<DashboardTrajectory, 'name' | 'commissionerName' | 'startDate' | 'endDate' | 'coaches'>) {
    return this.api.request<void>(`/dashboard/trajectories/${encodeURIComponent(code)}`, { method: 'PATCH', body: JSON.stringify(input) });
  }

  addParticipant(trajectoryCode: string, input: Pick<DashboardParticipant, 'name' | 'email' | 'phone' | 'coachId'>) {
    return this.api.request<{activationCode:string}>(`/dashboard/trajectories/${encodeURIComponent(trajectoryCode)}/participants`, { method: 'POST', body: JSON.stringify(input) });
  }

  updateParticipant(trajectoryCode: string, participantId: string, input: Pick<DashboardParticipant, 'name' | 'email' | 'phone' | 'coachId'>) {
    return this.api.request<void>(`/dashboard/trajectories/${encodeURIComponent(trajectoryCode)}/participants/${encodeURIComponent(participantId)}`, { method: 'PATCH', body: JSON.stringify(input) });
  }
  renewParticipantActivation(trajectoryCode:string,participantId:string){return this.api.request<{activationCode:string}>(`/dashboard/trajectories/${encodeURIComponent(trajectoryCode)}/participants/${encodeURIComponent(participantId)}/activation`,{method:'POST'})}

  uploadParticipantDocument(trajectoryCode: string, participantId: string, type: 'cv' | 'talent_report', file: File) {
    const body = new FormData();
    body.append('type', type);
    body.append('file', file);
    return this.api.request<void>(`/dashboard/trajectories/${encodeURIComponent(trajectoryCode)}/participants/${encodeURIComponent(participantId)}/documents`, { method: 'POST', body });
  }

  async openParticipantDocument(_document: ParticipantDocument): Promise<void> {
    throw new Error('Dit document kan via deze serverkoppeling nog niet worden geopend.');
  }
  async releaseTalentResults(): Promise<void> { throw new Error('Vrijgeven is via deze serverkoppeling nog niet beschikbaar.'); }
}
