import type { AppRole, AuthenticationResult, AuthRepository, ConsentChoice, PendingMfaAuthentication, SessionUser } from '../domain';
import { MfaAuthClient } from '../mfa/MfaAuthClient';

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
};

const accessTokenKey = 'munks-werkt-access-token';
const refreshTokenKey = 'munks-werkt-refresh-token';

class ExpiredSessionError extends Error {}

const tokenExpiresSoon = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now() + 60_000;
  } catch {
    return false;
  }
};

type SessionResponse = {
  user: { id: string; displayName: string };
  globalRoles: string[];
  trajectoryRoles: Array<{ trajectory_run_id: string; role: string }>;
  enrollments: Array<{ id: string; trajectory_run_id: string; status: string }> | null;
  security?: { mfaRequired?: boolean };
};

const assuranceLevel = (token: string): 'aal1' | 'aal2' => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { aal?: string };
    return payload.aal === 'aal2' ? 'aal2' : 'aal1';
  } catch {
    return 'aal1';
  }
};

const roleFor = (session: SessionResponse): AppRole => {
  if (session.globalRoles.includes('functional_admin')) return 'project_leader';
  if (session.trajectoryRoles.some(item => item.role === 'rsd_user')) return 'commissioner';
  if (session.trajectoryRoles.some(item => item.role === 'primary_coach' || item.role === 'trajectory_coach')) return 'coach';
  if (session.enrollments?.length) return 'participant';
  throw new Error('Aan dit account is nog geen rol toegekend.');
};

export class SupabaseAuthRepository implements AuthRepository {
  private refreshInFlight?: Promise<string>;
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

  async signIn(email: string, password: string): Promise<AuthenticationResult> {
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
    localStorage.setItem(accessTokenKey, token.access_token);
    localStorage.setItem(refreshTokenKey, token.refresh_token);
    return this.resolveAuthentication(token.access_token, token.user.id);
  }

  async restoreSession(): Promise<AuthenticationResult | undefined> {
    const token = localStorage.getItem(accessTokenKey);
    if (!token && !localStorage.getItem(refreshTokenKey)) return undefined;
    try {
      const accessToken = !token || tokenExpiresSoon(token) ? await this.refreshAccessToken() : token;
      try {
        return await this.resolveAuthentication(accessToken);
      } catch (error) {
        if (!(error instanceof ExpiredSessionError)) throw error;
        if (!localStorage.getItem(refreshTokenKey)) {
          localStorage.removeItem(accessTokenKey);
          return undefined;
        }
        return await this.resolveAuthentication(await this.refreshAccessToken());
      }
    } catch (error) {
      if (error instanceof ExpiredSessionError) {
        localStorage.removeItem(accessTokenKey);
        localStorage.removeItem(refreshTokenKey);
        return undefined;
      }
      throw error;
    }
  }

  private refreshAccessToken(): Promise<string> {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = this.exchangeRefreshToken().finally(() => { this.refreshInFlight = undefined; });
    return this.refreshInFlight;
  }

  private async exchangeRefreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(refreshTokenKey);
    if (!refreshToken) throw new ExpiredSessionError('De sessie is verlopen.');
    const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: this.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      if (response.status === 400 || response.status === 401) {
        localStorage.removeItem(accessTokenKey);
        localStorage.removeItem(refreshTokenKey);
        throw new ExpiredSessionError('De sessie is verlopen.');
      }
      throw new Error('De aanmelding kon tijdelijk niet worden vernieuwd.');
    }
    const refreshed = await response.json() as TokenResponse;
    if (!refreshed.access_token || !refreshed.refresh_token) throw new Error('De aanmelding kon tijdelijk niet worden vernieuwd.');
    localStorage.setItem(accessTokenKey, refreshed.access_token);
    localStorage.setItem(refreshTokenKey, refreshed.refresh_token);
    return refreshed.access_token;
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

  private async verifyEmailCode(email:string,code:string,type:'invite'|'recovery'):Promise<TokenResponse>{
    const cleanCode=code.replace(/\s/g,'');
    if(!email.trim()||!/^\d{6,8}$/.test(cleanCode))throw new Error('Vul je e-mailadres en de code uit de nieuwste e-mail in.');
    const response=await fetch(`${this.supabaseUrl}/auth/v1/verify`,{method:'POST',headers:{apikey:this.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:email.trim().toLowerCase(),token:cleanCode,type})});
    const result=await response.json().catch(()=>({})) as Partial<TokenResponse>&{code?:string;error_code?:string;message?:string;msg?:string};
    if(!response.ok||!result.access_token||!result.refresh_token){
      const errorCode=result.code??result.error_code??'';
      if(errorCode==='otp_expired'||response.status===401||/expired|invalid/i.test(`${result.message??''} ${result.msg??''}`))throw new Error('De code is ongeldig of verlopen. Vraag een nieuwe e-mail aan en gebruik de nieuwste code.');
      throw new Error('De code kon niet worden gecontroleerd. Probeer het opnieuw.');
    }
    return result as TokenResponse;
  }

  async completePasswordReset(email:string,code:string,password: string): Promise<PendingMfaAuthentication | void> {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    let token=hashParams.get('access_token');
    let refreshToken=hashParams.get('refresh_token');
    if(!token){
      const verified=await this.verifyEmailCode(email,code,'recovery');
      token=verified.access_token;
      refreshToken=verified.refresh_token;
    }
    localStorage.setItem(accessTokenKey,token);
    if(refreshToken)localStorage.setItem(refreshTokenKey,refreshToken);
    const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { code?: string; error_code?: string; msg?: string; message?: string; error_description?: string };
      const code = problem.code ?? problem.error_code ?? '';
      const detail = [problem.msg, problem.message, problem.error_description].filter(Boolean).join(' ');
      if (code === 'insufficient_aal' || /AAL2/i.test(detail)) {
        const authentication = await this.resolveAuthentication(token);
        if (authentication.status === 'authenticated') throw new Error('De extra beveiligingscontrole kon niet worden gestart. Vraag een nieuwe herstelcode aan.');
        return authentication;
      }
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
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    history.replaceState(null, '', location.pathname);
  }

  async completePasswordResetMfa(factorId:string,code:string,password:string):Promise<void>{
    const session=await this.mfaClient().verify(factorId,code);
    const response=await fetch(`${this.supabaseUrl}/auth/v1/user`,{
      method:'PUT',
      headers:{apikey:this.publishableKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},
      body:JSON.stringify({password}),
    });
    if(!response.ok){
      const problem=await response.json().catch(()=>({})) as {code?:string;error_code?:string;message?:string;msg?:string};
      const errorCode=problem.code??problem.error_code??'';
      const detail=`${problem.message??''} ${problem.msg??''}`;
      if(errorCode==='same_password'||/same password/i.test(detail))throw new Error('Kies een ander wachtwoord dan je huidige wachtwoord.');
      if(errorCode==='weak_password'||/weak password|too short/i.test(detail))throw new Error('Dit wachtwoord voldoet niet aan de beveiligingseisen. Kies een sterker wachtwoord.');
      throw new Error('Het wachtwoord kon na de authenticatorcontrole niet worden opgeslagen. Vraag een nieuwe herstelcode aan.');
    }
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    history.replaceState(null,'',location.pathname);
  }

  async completeStaffInvite(email:string,code:string,password:string):Promise<AuthenticationResult>{
    const hashParams=new URLSearchParams(location.hash.replace(/^#/,''));
    const queryParams=new URLSearchParams(location.search);
    let token=hashParams.get('access_token')||queryParams.get('access_token');
    let refreshToken=hashParams.get('refresh_token')||queryParams.get('refresh_token');
    if(!token){const verified=await this.verifyEmailCode(email,code,'invite');token=verified.access_token;refreshToken=verified.refresh_token}
    const response=await fetch(`${this.supabaseUrl}/auth/v1/user`,{method:'PUT',headers:{apikey:this.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({password})});
    if(!response.ok)throw new Error('Het wachtwoord kon niet worden ingesteld. Vraag zo nodig een nieuwe uitnodiging aan.');
    const user=await response.json() as {id:string};
    localStorage.setItem(accessTokenKey,token);
    if(refreshToken)localStorage.setItem(refreshTokenKey,refreshToken);
    history.replaceState(null,'',location.pathname);
    return this.resolveAuthentication(token,user.id);
  }

  async verifyMfa(factorId: string, code: string): Promise<SessionUser> {
    const session = await this.mfaClient().verify(factorId, code);
    localStorage.setItem(accessTokenKey, session.access_token);
    localStorage.setItem(refreshTokenKey, session.refresh_token);
    return this.getSessionUser(session.access_token);
  }

  private mfaClient() {
    return new MfaAuthClient(this.supabaseUrl, this.publishableKey, () => localStorage.getItem(accessTokenKey));
  }

  private async resolveAuthentication(accessToken: string, authenticatedUserId?: string): Promise<AuthenticationResult> {
    const mfaRequired = await this.getSecurityStatus(accessToken);
    if (!mfaRequired || assuranceLevel(accessToken) === 'aal2') return { status: 'authenticated', user: await this.getSessionUser(accessToken, authenticatedUserId) };
    const client = this.mfaClient();
    const factors = await client.listFactors();
    const verified = factors.find(factor => factor.status === 'verified');
    if (verified) return { status: 'mfa_challenge', factorId: verified.id };
    await client.removeUnverifiedFactors();
    const enrollment = await client.enroll();
    return { status: 'mfa_enroll', factorId: enrollment.id, qrCode: enrollment.totp.qr_code, secret: enrollment.totp.secret };
  }

  private async getSecurityStatus(accessToken: string): Promise<boolean> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api?security=1`, {
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401) throw new ExpiredSessionError('De sessie is verlopen.');
    if (!response.ok) throw new Error('De beveiligingsinstellingen konden niet worden gecontroleerd.');
    const result = await response.json() as { security?: { mfaRequired?: boolean } };
    return result.security?.mfaRequired === true;
  }

  private async getSessionContext(accessToken: string, authenticatedUserId?: string): Promise<{ user: SessionUser; mfaRequired: boolean }> {
    const sessionResponse = await fetch(`${this.supabaseUrl}/functions/v1/session-api`, {
      headers: {
        apikey: this.publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!sessionResponse.ok) {
      if (sessionResponse.status === 401) throw new ExpiredSessionError('De sessie is verlopen.');
      const problem = await sessionResponse.json().catch(() => ({})) as { message?: string; code?: string };
      throw new Error(problem.message || problem.code || `De rolcontrole is mislukt (${sessionResponse.status}).`);
    }

    const session = await sessionResponse.json() as SessionResponse;
    const organizationId = session.trajectoryRoles[0]?.trajectory_run_id
      ?? session.enrollments?.[0]?.trajectory_run_id
      ?? 'global';

    return {
      user: {
        id: authenticatedUserId ?? session.user.id,
        displayName: session.user.displayName,
        role: roleFor(session),
        organizationId,
      },
      mfaRequired: session.security?.mfaRequired === true,
    };
  }

  private async getSessionUser(accessToken: string, authenticatedUserId?: string): Promise<SessionUser> {
    return (await this.getSessionContext(accessToken, authenticatedUserId)).user;
  }

  async registerBiometric() {
    return 'unsupported' as const;
  }
}
