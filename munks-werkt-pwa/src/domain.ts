export type AppRole = 'participant' | 'coach' | 'project_leader' | 'commissioner';
export type StepStatus = 'completed' | 'current' | 'available' | 'locked';

export interface SessionUser {
  id: string;
  displayName: string;
  role: AppRole;
  organizationId: string;
}

export interface JourneyStep {
  number: number;
  title: string;
  status: StepStatus;
}

export interface ParticipantHome {
  user: SessionUser;
  trajectoryCode: string;
  currentStep: number;
  currentTitle: string;
  appointment: { dateLabel: string; timeLabel: string; coachName: string };
  steps: JourneyStep[];
  unreadMessages: number;
}

export interface ParticipantRepository {
  getHome(signal?: AbortSignal): Promise<ParticipantHome>;
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
  signIn(email: string, password: string): Promise<SessionUser>;
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

export interface DashboardParticipant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  appSteps: boolean[];
  attendance: Array<boolean | null>;
  needsAttention: boolean;
  completed: boolean;
  goals: 'Ja' | 'Deels' | 'Nee' | 'Nog niet bekend';
  outcomeCategory?: string;
  outcomeSummary?: string;
  startScores?: number[];
  endScores?: number[];
}

export interface DashboardTrajectory {
  code: string;
  name: string;
  commissionerName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'planned' | 'completed';
  participants: DashboardParticipant[];
}

export interface DashboardRepository {
  listTrajectories(role: Exclude<AppRole, 'participant'>): Promise<DashboardTrajectory[]>;
  updateAttendance(trajectoryCode: string, participantId: string, stepIndex: number, present: boolean): Promise<void>;
  releaseOutcome(trajectoryCode: string, participantId: string, category: string, summary: string): Promise<void>;
  createTrajectory(input: Pick<DashboardTrajectory, 'code' | 'name' | 'commissionerName' | 'startDate' | 'endDate'>): Promise<void>;
  updateTrajectory(code: string, input: Pick<DashboardTrajectory, 'name' | 'commissionerName' | 'startDate' | 'endDate'>): Promise<void>;
  addParticipant(trajectoryCode: string, input: Pick<DashboardParticipant, 'name' | 'email' | 'phone'>): Promise<void>;
}
