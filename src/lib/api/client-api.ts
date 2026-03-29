const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ClientApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getApiBase(): string {
  return API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
}

export function getGoogleAuthUrl(): string {
  return `${getApiBase()}/auth/google`;
}

export async function loginClient(email: string, password: string) {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = (body as { message?: string }).message || response.statusText;
    throw new ClientApiError(message, response.status);
  }

  return (await response.json()) as import('@/lib/types/auth').LoginResponse;
}
