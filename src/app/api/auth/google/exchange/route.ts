import { NextRequest, NextResponse } from 'next/server';
import { apiBase } from '@/lib/api/api';
import { forwardSessionCookies } from '@/lib/api/session';
import type { LoginResponse } from '@/lib/types/auth';

/**
 * Exchanges the single-use Google auth code for a session on the server.
 *
 * The exchange deliberately does not happen in the browser: doing it here means
 * the resulting session cookie is set by the backend and relayed as httpOnly,
 * so no credential is ever exposed to client JavaScript.
 */
export async function POST(request: NextRequest) {
  const { code } = (await request.json().catch(() => ({}))) as { code?: string };

  if (!code) {
    return NextResponse.json({ message: 'Missing auth code' }, { status: 400 });
  }

  let response: Response;

  try {
    response = await fetch(`${apiBase()}/auth/google/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    });
  } catch {
    // The API was unreachable, so the code was never consumed. Say so plainly
    // rather than letting a bare "fetch failed" become a 500.
    return NextResponse.json(
      { message: `Cannot reach the API at ${apiBase()} — is the backend running?` },
      { status: 503 }
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json({ message: body.message || 'Google sign-in failed' }, { status: response.status });
  }

  await forwardSessionCookies(response.headers.getSetCookie());

  const { user } = (await response.json()) as LoginResponse;

  // Only the non-sensitive profile crosses back to the browser — never a credential.
  return NextResponse.json({ user });
}
