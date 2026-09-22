export type AppRole = 'participant' | 'coach' | 'project_leader' | 'commissioner';
export type StepStatus = 'completed' | 'current' | 'available' | 'locked';

export interface SessionUser {
  id: string;
  displayName: string;
  role: AppRole;
  organizationId: string;
}

export type PendingMfaAuthentication =
  | { status: 'mfa_challenge'; factorId: string }
  | { status: 'mfa_enroll'; factorId: string; qrCode: string; secret: string };

export type AuthenticationResult =
  | { status: 'authenticated'; user: SessionUser }
  | PendingMfaAuthentication;

export interface JourneyStep {
  number: number;
  title: string;
  status: StepStatus;
}

export interface ParticipantHome {
  user: SessionUser;
  personalDetails?: { name: string; city: string; age: string; phone: string; email: string };
  trajectoryCode: string;
  trajectoryName?: string;
  trajectoryStatus?: 'active' | 'planned' | 'completed';
  currentStep: number;
  currentTitle: string;
  appointment: { id?:string; stepNumber?:number; dateLabel: string; timeLabel: string; coachName: string; title?: string; location?: string; explanation?:string };
  appointments?: ParticipantAppointment[];
  steps: JourneyStep[];
  unreadMessages: number;
  outcome?: {
    category: string;
    summary: string;
    status: 'provisional' | 'final';
  };
}

export interface ParticipantAppointment { id:string; stepNumber?:number; title:string; dateLabel:string; timeLabel:string; coachName:string; location?:string; explanation?:string }

export interface ParticipantRepository {
  getHome(signal?: AbortSignal): Promise<ParticipantHome>;
}

export interface ProgressRepository {
  completeStep(stepNumber: number): Promise<void>;
}

export interface ConsentChoice {
  privacyVersion: string;
  consentVersion: string;
  privacyAccepted: boolean;
  consentAccepted: boolean;
  aiAssistantEnabled: boolean;
}

export interface AuthRepository {
  beginActivation(email: string, activationCode: string): Promise<{ activationSessionId: string }>;
  completeActivation(activationSessionId: string, password: string, consent: ConsentChoice): Promise<void>;
  completeStaffInvite?(password: string): Promise<AuthenticationResult>;
  requestPasswordReset?(email: string): Promise<void>;
  completePasswordReset?(password: string): Promise<void>;
  signIn(email: string, password: string): Promise<AuthenticationResult>;
  restoreSession?(): Promise<AuthenticationResult | undefined>;
  verifyMfa?(factorId: string, code: string): Promise<SessionUser>;
  registerBiometric(): Promise<'registered' | 'unsupported'>;
}

export type DataAudience = 'participant' | 'coach' | 'commissioner';
export type ActivityKind = 'introduction' | 'text' | 'choice' | 'measurement' | 'external' | 'review' | 'meeting' | 'result';

export interface TrajectoryActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  explanation?: string;
  estimatedMinutes?: number;
  skippable?: boolean;
  audiences: DataAudience[];
}

export interface TrajectoryDefinition {
  code: string;
  title: string;
  steps: Array<{
    number: number;
    title: string;
    hasGroupMeeting: boolean;
    activities: TrajectoryActivity[];
  }>;
}

export interface ParticipantAnswer {
  participantId: string;
  trajectoryCode: string;
  activityId: string;
  value: string | string[] | Record<string, string | number>;
  updatedAt: string;
}

export interface AnswerRepository {
  save(answer: ParticipantAnswer): Promise<void>;
  get(participantId: string, trajectoryCode: string, activityId: string): Promise<ParticipantAnswer | undefined>;
}

export interface ParticipantMessage {
  id: string;
  sender: 'participant' | 'coach';
  senderName: string;
  body: string;
  sentAt: string;
  read: boolean;
}

export interface MessageThread {
  id: string;
  kind: 'message' | 'help_request';
  subject: string;
  status: 'open' | 'handled' | 'closed';
  coachName: string;
  updatedAt: string;
  unread: number;
  messages: ParticipantMessage[];
}

export interface MessageRepository {
  list(): Promise<MessageThread[]>;
  start(kind: MessageThread['kind'], subject: string, body: string): Promise<string>;
  reply(threadId: string, body: string): Promise<void>;
  markRead(threadId: string): Promise<void>;
}

export interface StaffMessageThread extends MessageThread {
  participantId: string;
  participantName: string;
  trajectoryCode: string;
}

export interface StaffMessageRepository {
  list(trajectoryCode: string): Promise<StaffMessageThread[]>;
  reply(threadId: string, body: string): Promise<void>;
  markRead(threadId: string): Promise<void>;
  markHandled(threadId: string): Promise<void>;
}

export type TalentTestStatus = 'not_started' | 'completed' | 'released';

export interface TalentTestRepository {
  getStatus(participantId: string, trajectoryCode: string): Promise<TalentTestStatus>;
  recordConsent(participantId: string, trajectoryCode: string, choice: 'accepted' | 'discuss'): Promise<void>;
  markCompleted(participantId: string, trajectoryCode: string): Promise<void>;
  releaseResults(participantId: string, trajectoryCode: string): Promise<void>;
}

export interface ParticipantDocument {
  type: 'cv' | 'talent_report';
  fileName: string;
  uploadedAt: string;
  storagePath?: string;
}

export interface DashboardParticipant {
  id: string;
  active?: boolean;
  activatedAt?: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  birthDate?: string;
  appSteps: boolean[];
  attendance: Array<boolean | null>;
  needsAttention: boolean;
  completed: boolean;
  goals: 'Ja' | 'Deels' | 'Nee' | 'Nog niet bekend';
  outcomeCategory?: string;
  outcomeSummary?: string;
  outcomeStatus?: 'provisional' | 'final';
  startScores?: number[];
  endScores?: number[];
  coachId?: string;
  talentStatus?: TalentTestStatus;
  appAnswers?: Array<{
    step: number;
    title: string;
    answers: Array<{ question: string; answer: string }>;
  }>;
  documents?: ParticipantDocument[];
}

export interface DashboardCoach {
  id: string;
  name: string;
}

export interface DashboardAppointment { id:string; trajectoryCode:string; stepNumber:number; title:string; date:string; startTime:string; endTime:string; location:string; explanation:string; coachId:string; coachName:string; cancelled:boolean; participantId?:string; participantName?:string }

export interface DashboardManagementOptions {
  coaches: DashboardCoach[];
  commissioners: Array<{ code: string; name: string }>;
  organizations?: Array<{ code: string; name: string; active: boolean }>;
  users?: ManagedUser[];
  security?: { mfaRequired: boolean };
}
export type ManagedRole = 'project_leader' | 'coach' | 'commissioner';
export interface ManagedUser { id:string; name:string; email:string; role:ManagedRole; organization:string; commissionerCode?:string; trajectoryCodes:string[]; active:boolean }

export interface DashboardTrajectory {
  code: string;
  name: string;
  commissionerName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'planned' | 'completed';
  coaches: DashboardCoach[];
  participants: DashboardParticipant[];
}

export interface DashboardRepository {
  listTrajectories(role: Exclude<AppRole, 'participant'>): Promise<DashboardTrajectory[]>;
  listManagementOptions(): Promise<DashboardManagementOptions>;
  saveManagedUser(user: ManagedUser): Promise<void>;
  setMfaRequired(required: boolean): Promise<void>;
  resetManagedUserMfa(userId: string): Promise<void>;
  saveCommissioner(organization: { code:string; name:string; active:boolean }): Promise<void>;
  listAppointments(trajectoryCode: string): Promise<DashboardAppointment[]>;
  saveAppointment(appointment: Omit<DashboardAppointment, 'coachName' | 'cancelled' | 'participantName'>): Promise<void>;
  setAppointmentActive(appointmentId: string, active: boolean): Promise<void>;
  updateAttendance(trajectoryCode: string, participantId: string, stepIndex: number, present: boolean): Promise<void>;
  releaseOutcome(trajectoryCode: string, participantId: string, category: string, summary: string, status: 'provisional' | 'final', goals: DashboardParticipant['goals']): Promise<void>;
  createTrajectory(input: Pick<DashboardTrajectory, 'code' | 'name' | 'commissionerName' | 'startDate' | 'endDate' | 'coaches'>): Promise<void>;
  updateTrajectory(code: string, input: Pick<DashboardTrajectory, 'name' | 'commissionerName' | 'startDate' | 'endDate' | 'coaches'>): Promise<void>;
  addParticipant(trajectoryCode: string, input: Pick<DashboardParticipant, 'name' | 'email' | 'phone' | 'city' | 'birthDate' | 'coachId'>): Promise<{ activationCode: string }>;
  updateParticipant(trajectoryCode: string, participantId: string, input: Pick<DashboardParticipant, 'name' | 'email' | 'phone' | 'city' | 'birthDate' | 'coachId' | 'active'>): Promise<void>;
  renewParticipantActivation(trajectoryCode: string, participantId: string): Promise<{ activationCode: string }>;
  uploadParticipantDocument(trajectoryCode: string, participantId: string, type: 'cv' | 'talent_report', file: File): Promise<void>;
  openParticipantDocument(document: ParticipantDocument): Promise<void>;
  releaseTalentResults(trajectoryCode: string, participantId: string): Promise<void>;
}

export interface ParticipantDocumentRepository {
  list(): Promise<ParticipantDocument[]>;
  open(document: ParticipantDocument): Promise<void>;
}
