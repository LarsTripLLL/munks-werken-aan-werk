import type { AppRole, AuthRepository, ConsentChoice, SessionUser } from '../domain';

type TokenResponse = {
  access_token: string;
  user: { id: string; email?: string };
};

type SessionResponse = {
  user: { id: string; displayName: string };
  globalRoles: string[];
  trajectoryRoles: Array<{ trajectory_run_id: string; role: string }>;
  enrollments: Array<{ id: string; trajectory_run_id: string; status: string }> | null;
};

const roleFor = (session: SessionResponse): AppRole => {
  if (session.globalRoles.includes('functional_admin')) return 'project_leader';
  if (session.trajectoryRoles.some(item => item.role === 'rsd_user')) return 'commissioner';
  if (session.trajectoryRoles.some(item => item.role === 'primary_coach' || item.role === 'trajectory_coach')) return 'coach';
  if (session.enrollments?.length) return 'participant';
  throw new Error('Aan dit account is nog geen rol toegekend.');
};

export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly supabaseUrl: string,
    private readonly publishableKey: string,
  ) {}

  async beginActivation(email: string, activationCode: string): Promise<{ activationSessionId: string }> {
    return this.activationRequest({action:'begin_activation',email,code:activationCode});
  }

  async completeActivation(sessionId: string, password: string, consent: ConsentChoice) {
    await this.activationRequest({action:'complete_activation',sessionId,password,consent});
  }

  private async activationRequest<T>(body:Record<string,unknown>):Promise<T>{const response=await fetch(`${this.supabaseUrl}/functions/v1/activation-api`,{method:'POST',headers:{apikey:this.publishableKey,'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json().catch(()=>({})) as T&{message?:string};if(!response.ok)throw new Error(result.message||'De accountactivatie is niet gelukt.');return result}

  async signIn(email: string, password: string): Promise<SessionUser> {
    const tokenResponse = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: this.publishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Het e-mailadres of wachtwoord is niet juist.');
    }

    const token = await tokenResponse.json() as TokenResponse;
    localStorage.setItem('munks-werkt-access-token', token.access_token);
    return this.getSessionUser(token.access_token, token.user.id);
  }

  async restoreSession(): Promise<SessionUser | undefined> {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) return undefined;
    try {
      return await this.getSessionUser(token);
    } catch {
      localStorage.removeItem('munks-werkt-access-token');
      return undefined;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const redirectTo = `${location.origin}${location.pathname}`;
    const response = await fetch(`${this.supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: 'POST',
      headers: { apikey: this.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { code?: string; error_code?: string; msg?: string; message?: string };
      const code = problem.code ?? problem.error_code ?? '';
      const detail = [problem.msg, problem.message].filter(Boolean).join(' ');
      if (response.status === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || /rate limit|too many requests/i.test(detail)) {
        throw new Error('Er zijn tijdelijk te veel e-mails aangevraagd. Wacht tot de verzendlimiet is hersteld en probeer het dan opnieuw.');
      }
      if (/email address not authorized/i.test(detail)) {
        throw new Error('Supabase mag naar dit e-mailadres nog geen e-mail versturen. Controleer de e-mailinstellingen van het project.');
      }
      throw new Error('De resetmail kon niet worden verstuurd. Controleer de e-mailinstellingen of probeer het later opnieuw.');
    }
  }

  async completePasswordReset(password: string): Promise<void> {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const token = hashParams.get('access_token');
    if (hashParams.get('type') !== 'recovery' || !token) {
      throw new Error('De resetlink is ongeldig of verlopen. Vraag een nieuwe resetmail aan.');
    }
    const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { code?: string; error_code?: string; msg?: string; message?: string; error_description?: string };
      const code = problem.code ?? problem.error_code ?? '';
      const detail = [problem.msg, problem.message, problem.error_description].filter(Boolean).join(' ');
      if (code === 'same_password' || /same password|different from the old password/i.test(detail)) {
        throw new Error('Kies een ander wachtwoord dan je huidige wachtwoord.');
      }
      if (code === 'weak_password' || /weak password|password is too short|password should contain/i.test(detail)) {
        throw new Error('Dit wachtwoord voldoet niet aan de beveiligingseisen. Kies een sterker wachtwoord.');
      }
      if (code === 'otp_expired' || code === 'session_not_found' || response.status === 401) {
        throw new Error('De resetlink is verlopen. Vraag een nieuwe resetmail aan.');
      }
      const safeCode = /^[a-z0-9_]{1,64}$/.test(code) ? code : `HTTP ${response.status}`;
      throw new Error(`Het wachtwoord kon niet worden gewijzigd (foutcode: ${safeCode}). Probeer het opnieuw.`);
    }
    localStorage.removeItem('munks-werkt-access-token');
    history.replaceState(null, '', location.pathname);
  }

  async completeStaffInvite(password:string):Promise<SessionUser>{const hashParams=new URLSearchParams(location.hash.replace(/^#/,''));const queryParams=new URLSearchParams(location.search);const token=hashParams.get('access_token')||queryParams.get('access_token');if(!token)throw new Error('De uitnodigingslink is ongeldig of verlopen.');const response=await fetch(`${this.supabaseUrl}/auth/v1/user`,{method:'PUT',headers:{apikey:this.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({password})});if(!response.ok)throw new Error('Het wachtwoord kon niet worden ingesteld. Vraag zo nodig een nieuwe uitnodiging aan.');const user=await response.json() as {id:string};localStorage.setItem('munks-werkt-access-token',token);history.replaceState(null,'',location.pathname);return this.getSessionUser(token,user.id)}

  private async getSessionUser(accessToken: string, authenticatedUserId?: string): Promise<SessionUser> {
    const sessionResponse = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      headers: {
        apikey: this.publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!sessionResponse.ok) {
      localStorage.removeItem('munks-werkt-access-token');
      const problem = await sessionResponse.json().catch(() => ({})) as { message?: string; code?: string };
      throw new Error(problem.message || problem.code || `De rolcontrole is mislukt (${sessionResponse.status}).`);
    }

    const session = await sessionResponse.json() as SessionResponse;
    const organizationId = session.trajectoryRoles[0]?.trajectory_run_id
      ?? session.enrollments?.[0]?.trajectory_run_id
      ?? 'global';

    return {
      id: authenticatedUserId ?? session.user.id,
      displayName: session.user.displayName,
      role: roleFor(session),
      organizationId,
    };
  }

  async registerBiometric() {
    return 'unsupported' as const;
  }
}
