export interface AiMessage { id:string; sender:'participant'|'assistant'; body:string; sentAt:string }
export class SupabaseAiRepository {
 constructor(private url:string,private key:string){}
 private async request<T>(body:Record<string,unknown>):Promise<T>{const token=localStorage.getItem('munks-werkt-access-token');if(!token)throw new Error('Meld je opnieuw aan.');const response=await fetch(`${this.url}/functions/v1/ai-assistant`,{method:'POST',headers:{apikey:this.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json().catch(()=>({})) as T&{message?:string};if(!response.ok)throw new Error(result.message||'De AI-assistent is niet bereikbaar.');return result}
 async list(){return (await this.request<{messages:AiMessage[]}>({action:'list'})).messages}
 async send(message:string){return (await this.request<{answer:string}>({action:'send',message})).answer}
 async status(){return (await this.request<{enabled:boolean}>({action:'status'})).enabled}
 async setEnabled(enabled:boolean){return (await this.request<{enabled:boolean}>({action:'set_preference',message:String(enabled)})).enabled}
}
