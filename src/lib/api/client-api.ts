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

/**
 * Starts the Google OAuth redirect. This is a full-page navigation to the
 * backend rather than a fetch, so no token handling happens in the browser.
 */
export function getGoogleAuthUrl(lang?: string): string {
  const base = `${getApiBase()}/auth/google`;
  return lang ? `${base}?lang=${lang}` : base;
}

/**
 * Completes Google sign-in through this app's own server route.
 *
 * The call goes to the Next.js server, not the API: the server performs the
 * exchange and relays the backend's httpOnly session cookie, so the browser
 * receives a session it cannot read and returns only the user profile.
 */
export async function exchangeGoogleCode(code: string) {
  const response = await fetch('/api/auth/google/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = (body as { message?: string }).message || response.statusText;
    throw new ClientApiError(message, response.status);
  }

  return (await response.json()) as { user: import('@/lib/types/auth').User };
}
