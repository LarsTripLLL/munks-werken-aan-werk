import type { AuthRepository, ConsentChoice } from '../domain';

const wait = () => new Promise(resolve => window.setTimeout(resolve, 220));

export class DemoAuthRepository implements AuthRepository {
  async beginActivation(email: string, activationCode: string) {
    await wait();
    if (!email.includes('@') || !/^\d{6,8}$/.test(activationCode)) throw new Error('Controleer je e-mailadres en activatiecode.');
    return { activationSessionId: 'demo-activation-session' };
  }

  async completeActivation(_sessionId: string, _password: string, consent: ConsentChoice) {
    await wait();
    if (!consent.privacyAccepted || !consent.consentAccepted) throw new Error('Beide verklaringen moeten zijn geaccepteerd.');
  }

  async signIn(email: string, password: string) {
    await wait();
    if (!email.includes('@') || password.length < 8) throw new Error('Controleer je e-mailadres en wachtwoord.');
    return { status: 'authenticated' as const, user: { id: 'demo-participant', displayName: 'Sam', role: 'participant' as const, organizationId: 'demo-rsd' } };
  }

  async completeStaffInvite(email:string,code:string,password:string){
    await wait();
    if(!email.includes('@')||!/^\d{6}$/.test(code)||password.length<8)throw new Error('Controleer je e-mailadres, code en wachtwoord.');
    return {status:'authenticated' as const,user:{id:'demo-staff',displayName:'Testgebruiker',role:'coach' as const,organizationId:'demo'}};
  }

  async requestPasswordReset(){await wait()}
  async completePasswordReset(email:string,code:string,password:string){await wait();if(!email.includes('@')||!/^\d{6}$/.test(code)||password.length<8)throw new Error('Controleer je e-mailadres, code en wachtwoord.')}

  async registerBiometric() {
    await wait();
    return window.PublicKeyCredential ? 'registered' as const : 'unsupported' as const;
  }
}
