/** Supabase TOTP calls. Not connected to the app until the complete MFA flow is ready. */
export type TotpFactor = {
  id: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  friendly_name?: string;
};

export type TotpEnrollment = {
  id: string;
  totp: { qr_code: string; secret: string; uri: string };
};

export type VerifiedMfaSession = {
  access_token: string;
  refresh_token: string;
};

export class MfaAuthClient {
  constructor(
    private readonly supabaseUrl: string,
    private readonly publishableKey: string,
    private readonly getAccessToken: () => string | null,
  ) {}

  private async request<T>(path: string, method: 'GET' | 'POST' | 'DELETE', body?: object): Promise<T> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Meld je opnieuw aan voordat je de tweede stap uitvoert.');
    const response = await fetch(`${this.supabaseUrl}/auth/v1/${path}`, {
      method,
      headers: {
        apikey: this.publishableKey,
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Je aanmelding is verlopen. Log opnieuw in.');
      if (response.status === 429) throw new Error('Je hebt te vaak een code geprobeerd. Wacht even en probeer opnieuw.');
      throw new Error('De tweede beveiligingsstap is niet gelukt. Probeer het opnieuw.');
    }
    return response.json() as Promise<T>;
  }

  async listFactors(): Promise<TotpFactor[]> {
    const user = await this.request<{ factors?: TotpFactor[] }>('user', 'GET');
    return (user.factors ?? []).filter(factor => factor.factor_type === 'totp');
  }

  async removeUnverifiedFactors(): Promise<void> {
    const factors = await this.listFactors();
    await Promise.all(factors.filter(factor => factor.status === 'unverified').map(factor =>
      this.request<unknown>(`factors/${encodeURIComponent(factor.id)}`, 'DELETE'),
    ));
  }

  enroll(): Promise<TotpEnrollment> {
    return this.request<TotpEnrollment>('factors', 'POST', {
      factor_type: 'totp',
      friendly_name: 'Munks Werkt',
      issuer: 'https://munkswerkt.nl',
    });
  }

  async verify(factorId: string, code: string): Promise<VerifiedMfaSession> {
    if (!/^\d{6}$/.test(code)) throw new Error('Vul de zescijferige code uit je authenticator-app in.');
    const safeFactorId = encodeURIComponent(factorId);
    const challenge = await this.request<{ id: string }>(`factors/${safeFactorId}/challenge`, 'POST', {});
    const session = await this.request<VerifiedMfaSession>(`factors/${safeFactorId}/verify`, 'POST', {
      challenge_id: challenge.id,
      code,
    });
    if (!session.access_token || !session.refresh_token) {
      throw new Error('De tweede stap is gelukt, maar de beveiligde sessie kon niet worden geopend. Probeer opnieuw in te loggen.');
    }
    return session;
  }
}
