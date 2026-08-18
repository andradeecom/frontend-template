import 'server-only';

import { cookies } from 'next/headers';

/**
 * The single credential the browser holds: an opaque session id in an httpOnly
 * cookie set by the backend. Nothing in this app ever reads its value — it is
 * forwarded verbatim on server-to-server calls and is invisible to client JS.
 *
 * The `__Host-` prefix is browser-enforced: the cookie is only accepted when it
 * is `Secure`, carries no `Domain`, and uses `Path=/`. That requires HTTPS, so
 * plain-http local development falls back to the unprefixed name.
 */
export const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session';

/**
 * Double-submit CSRF token. Unlike the session cookie this one is readable by
 * design — it has to be echoed back in a header. It is not a credential: it
 * proves only that the request came from a page able to read this origin's
 * cookies, which a cross-site attacker cannot do.
 */
export const CSRF_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-csrf_token' : 'csrf_token';

export const CSRF_HEADER = 'X-CSRF-Token';

/** Reads the CSRF token for echoing back upstream. Server-side only. */
export async function getCsrfToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value;
}

/** Reads the raw session id for forwarding upstream. Server-side only. */
export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/**
 * Copies the backend's `Set-Cookie` directives onto the Next.js response.
 *
 * The backend is the sole authority on session lifetime and cookie flags, so
 * the values are parsed and re-emitted rather than reconstructed — that keeps
 * `HttpOnly`/`Secure`/`SameSite` in one place instead of drifting across two
 * codebases.
 */
export async function forwardSessionCookies(setCookieHeaders: string[]): Promise<void> {
  if (setCookieHeaders.length === 0) return;

  const store = await cookies();

  for (const header of setCookieHeaders) {
    const parsed = parseSetCookie(header);
    if (!parsed) continue;

    store.set(parsed.name, parsed.value, {
      httpOnly: parsed.httpOnly,
      secure: parsed.secure,
      sameSite: parsed.sameSite,
      path: parsed.path ?? '/',
      ...(parsed.maxAge !== undefined && { maxAge: parsed.maxAge }),
      ...(parsed.expires && { expires: parsed.expires }),
    });
  }
}

interface ParsedCookie {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge?: number;
  expires?: Date;
}

function parseSetCookie(header: string): ParsedCookie | null {
  const [pair, ...attributes] = header.split(';').map((part) => part.trim());
  const separator = pair.indexOf('=');
  if (separator === -1) return null;

  const parsed: ParsedCookie = {
    name: pair.slice(0, separator),
    value: pair.slice(separator + 1),
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
  };

  for (const attribute of attributes) {
    const [rawKey, rawValue] = attribute.split('=');
    const key = rawKey.toLowerCase();

    if (key === 'httponly') parsed.httpOnly = true;
    else if (key === 'secure') parsed.secure = true;
    else if (key === 'path') parsed.path = rawValue;
    else if (key === 'max-age') parsed.maxAge = Number(rawValue);
    else if (key === 'expires') parsed.expires = new Date(rawValue);
    else if (key === 'samesite') {
      const value = rawValue?.toLowerCase();
      if (value === 'lax' || value === 'strict' || value === 'none') {
        parsed.sameSite = value;
      }
    }
  }

  return parsed;
}

/** Drops the session cookie locally, after the backend has deleted the row. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(CSRF_COOKIE);
}
