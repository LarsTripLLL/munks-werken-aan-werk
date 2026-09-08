import type { AppRole, DashboardRepository, DashboardTrajectory } from '../domain';

const trajectories: DashboardTrajectory[]=[
 {code:'MW-RSD-001',name:'Munks Werkt Zeist',commissionerName:'Regionale Sociale Dienst Kromme Rijn Heuvelrug',startDate:'01-09-2026',endDate:'20-10-2026',status:'active',participants:[
  {id:'p1',name:'Sam de Jong',appSteps:[true,true,true,false,false,false,false],attendance:[true,true,null,true,null,false,false],needsAttention:false,completed:false,goals:'Deels',startScores:[5,6,6,4,5]},
  {id:'p2',name:'Noor Bakker',appSteps:[true,true,true,true,true,false,false],attendance:[true,true,null,true,null,true,false],needsAttention:true,completed:false,goals:'Deels',startScores:[4,5,7,4,4]},
  {id:'p3',name:'Yassin El Amrani',appSteps:[true,true,false,false,false,false,false],attendance:[true,false,null,false,null,false,false],needsAttention:true,completed:false,goals:'Nee',startScores:[3,4,4,3,4]}
 ]},
 {code:'MW-RSD-002',name:'Munks Werkt Amersfoort',commissionerName:'Regionale Sociale Dienst Kromme Rijn Heuvelrug',startDate:'15-09-2026',endDate:'03-11-2026',status:'active',participants:[
  {id:'p4',name:'Sophie de Wit',appSteps:[true,true,true,true,true,true,true],attendance:[true,true,null,true,null,true,true],needsAttention:false,completed:true,goals:'Ja',outcomeCategory:'Werk en opleiding',outcomeSummary:'Start met een BBL-traject in de verkoop.',startScores:[4,5,6,4,5],endScores:[8,8,8,7,8]},
  {id:'p5',name:'Daniël Smit',appSteps:[true,true,true,true,false,false,false],attendance:[true,true,null,true,null,false,false],needsAttention:false,completed:false,goals:'Deels',startScores:[5,5,5,5,5]}
 ]}
];

export class DemoDashboardRepository implements DashboardRepository {
 async listTrajectories(_role:Exclude<AppRole,'participant'>){return structuredClone(trajectories)}
 async updateAttendance(trajectoryCode:string,participantId:string,stepIndex:number,present:boolean){const participant=trajectories.find(t=>t.code===trajectoryCode)?.participants.find(p=>p.id===participantId);if(!participant||participant.attendance[stepIndex]===null)throw new Error('Aanwezigheid kan voor deze stap niet worden gewijzigd.');participant.attendance[stepIndex]=present}
 async releaseOutcome(trajectoryCode:string,participantId:string,category:string,summary:string){const participant=trajectories.find(t=>t.code===trajectoryCode)?.participants.find(p=>p.id===participantId);if(!participant)throw new Error('Deelnemer niet gevonden.');participant.outcomeCategory=category;participant.outcomeSummary=summary;participant.completed=true}
 async createTrajectory(input:Pick<DashboardTrajectory,'code'|'name'|'commissionerName'|'startDate'|'endDate'>){if(trajectories.some(t=>t.code===input.code))throw new Error('Deze trajectcode bestaat al.');trajectories.push({...input,status:'planned',participants:[]})}
 async updateTrajectory(code:string,input:Pick<DashboardTrajectory,'name'|'commissionerName'|'startDate'|'endDate'>){const trajectory=trajectories.find(t=>t.code===code);if(!trajectory)throw new Error('Traject niet gevonden.');Object.assign(trajectory,input)}
 async addParticipant(trajectoryCode:string,input:Pick<DashboardParticipant,'name'|'email'|'phone'>){const trajectory=trajectories.find(t=>t.code===trajectoryCode);if(!trajectory)throw new Error('Traject niet gevonden.');trajectory.participants.push({id:`p${Date.now()}`,name:input.name,email:input.email,phone:input.phone,appSteps:[false,false,false,false,false,false,false],attendance:[false,false,null,false,null,false,false],needsAttention:false,completed:false,goals:'Nog niet bekend'})}
}
