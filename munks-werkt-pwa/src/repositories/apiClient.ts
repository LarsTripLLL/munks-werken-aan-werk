export class ApiClient {
  constructor(private readonly baseUrl = '/api') {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(problem.message || 'De verbinding met Munks Werkt is mislukt.');
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}
