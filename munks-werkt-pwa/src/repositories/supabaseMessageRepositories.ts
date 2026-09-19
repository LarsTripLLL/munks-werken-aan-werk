import type { MessageRepository, MessageThread, StaffMessageRepository, StaffMessageThread } from '../domain';
import { formatDateTime } from '../formatDateTime';

const formatThreads = <T extends MessageThread | StaffMessageThread>(threads: T[]): T[] =>
  threads.map(thread => ({
    ...thread,
    updatedAt: formatDateTime(thread.updatedAt),
    messages: thread.messages.map(message => ({ ...message, sentAt: formatDateTime(message.sentAt) })),
  }));

export class SupabaseMessageRepositories {
  private readonly participantRepositories = new Map<string, MessageRepository>();
  private staffRepository?: StaffMessageRepository;
  constructor(private readonly supabaseUrl:string, private readonly publishableKey:string) {}
  private async rpc<T>(name:string, body:Record<string,unknown>={}):Promise<T>{
    const token=localStorage.getItem('munks-werkt-access-token');
    if(!token) throw new Error('Aanmelden is vereist.');
    const response=await fetch(`${this.supabaseUrl}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:this.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json().catch(()=>null) as T|{message?:string}|null;
    if(!response.ok) throw new Error((result&&typeof result==='object'&&'message' in result&&result.message)||'Het bericht kon niet worden verwerkt.');
    return result as T;
  }
  participant(trajectoryCode:string):MessageRepository{
    const existing = this.participantRepositories.get(trajectoryCode);
    if (existing) return existing;
    const repository: MessageRepository = {
    list:async()=>formatThreads(await this.rpc<MessageThread[]>('list_my_message_threads')),
    start:(kind,subject,body)=>this.rpc<string>('start_my_thread',{p_trajectory_code:trajectoryCode,p_kind:kind,p_subject:subject,p_body:body}),
    reply:(threadId,body)=>this.rpc<void>('reply_to_my_thread',{p_thread_id:threadId,p_body:body}),
    markRead:(threadId)=>this.rpc<void>('mark_my_thread_read',{p_thread_id:threadId}),
    };
    this.participantRepositories.set(trajectoryCode, repository);
    return repository;
  }
  staff():StaffMessageRepository{
    if (this.staffRepository) return this.staffRepository;
    this.staffRepository = {
    list:async(trajectoryCode)=>formatThreads(await this.rpc<StaffMessageThread[]>('list_my_assigned_threads',{p_trajectory_code:trajectoryCode})),
    reply:(threadId,body)=>this.rpc<void>('reply_as_assigned_coach',{p_thread_id:threadId,p_body:body}),
    markRead:(threadId)=>this.rpc<void>('mark_assigned_thread_read',{p_thread_id:threadId}),
    markHandled:(threadId)=>this.rpc<void>('mark_assigned_thread_handled',{p_thread_id:threadId}),
    };
    return this.staffRepository;
  }
}
