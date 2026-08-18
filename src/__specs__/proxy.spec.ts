import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { SESSION_COOKIE } from '@/lib/api/session';

/**
 * The middleware decides where an unauthenticated visitor lands. It is
 * deliberately NOT an authorization check — it only asks whether a session
 * cookie is present, because the cookie is opaque and only the backend can
 * judge it. These specs pin that boundary: a redirect hint that cannot be
 * mistaken for enforcement.
 */

const buildRequest = (path: string, options: { session?: boolean; locale?: string; acceptLanguage?: string } = {}) => {
  const headers = options.acceptLanguage ? { 'accept-language': options.acceptLanguage } : undefined;
  const request = new NextRequest(new URL(`http://localhost:3000${path}`), { headers });
  if (options.session) {
    request.cookies.set(SESSION_COOKIE, 'opaque-id');
  }
  if (options.locale) {
    request.cookies.set('locale', options.locale);
  }
  return request;
};

const locationOf = (response: Response) => response.headers.get('location') ?? '';

describe('locale routing', () => {
  // Rewrite, not redirect: the visitor keeps the locale-less URL and is served
  // the localised route directly, saving a round trip. A redirect would show a
  // 307 and a Location header; a rewrite shows neither.
  it('rewrites an unprefixed path instead of redirecting', async () => {
    const response = await proxy(buildRequest('/home', { session: true }));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/(en|es|pt)\/home$/);
  });

  it('preserves the query string when rewriting', async () => {
    const response = await proxy(buildRequest('/home?foo=bar', { session: true }));
    expect(response.headers.get('x-middleware-rewrite')).toContain('foo=bar');
  });

  it('rewrites the bare root without doubling the slash', async () => {
    const response = await proxy(buildRequest('/', { session: true }));
    const target = response.headers.get('x-middleware-rewrite') ?? locationOf(response);

    // Guard the path only — `//` also appears in the `http://` scheme.
    expect(new URL(target).pathname).not.toContain('//');
  });

  // Lets a Server Component read the negotiated locale without re-running
  // negotiation on every request.
  it('records the negotiated locale in a cookie', async () => {
    const response = await proxy(buildRequest('/home', { session: true }));
    expect(response.cookies.get('locale')?.value).toMatch(/^(en|es|pt)$/);
  });

  it('leaves an already-prefixed path alone', async () => {
    const response = await proxy(buildRequest('/en/home', { session: true }));
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(response.headers.get('location')).toBeNull();
  });
});

describe('explicit language choice', () => {
  // Without this the selector appears to do nothing for anyone whose browser
  // asks for a different language: negotiation would overrule the choice on
  // the very next request.
  it('prefers the locale cookie over Accept-Language', async () => {
    const response = await proxy(
      buildRequest('/home', { session: true, locale: 'es', acceptLanguage: 'pt-BR,pt;q=0.9' })
    );

    expect(response.headers.get('x-middleware-rewrite')).toContain('/es/home');
  });

  it('falls back to negotiation when no choice has been made', async () => {
    const response = await proxy(buildRequest('/home', { session: true, acceptLanguage: 'pt-BR,pt;q=0.9' }));

    expect(response.headers.get('x-middleware-rewrite')).toContain('/pt/home');
  });

  // The cookie is attacker-writable, and its value is interpolated into a
  // rewrite path, so an unsupported value must not steer routing.
  it('ignores an unsupported locale cookie', async () => {
    const response = await proxy(
      buildRequest('/home', { session: true, locale: '../etc/passwd', acceptLanguage: 'en-US' })
    );

    expect(response.headers.get('x-middleware-rewrite')).toContain('/en/home');
  });

  it('does not overwrite an explicit choice with the negotiated value', async () => {
    const response = await proxy(buildRequest('/home', { session: true, locale: 'es', acceptLanguage: 'pt-BR' }));

    expect(response.cookies.get('locale')).toBeUndefined();
  });
});

describe('gating applies to unprefixed paths too', () => {
  // The rewrite must not become a way around the session check: /home and
  // /en/home have to gate identically, or the locale-less URL is a bypass.
  it('bounces an unauthenticated visitor from an unprefixed private path', async () => {
    const response = await proxy(buildRequest('/home'));
    expect(locationOf(response)).toContain('/login');
  });

  it('allows an unprefixed public path through', async () => {
    const response = await proxy(buildRequest('/login'));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/(en|es|pt)\/login$/);
  });
});

describe('session gating', () => {
  // The redirect target is locale-less: the middleware rewrites it on the way
  // back, so the visitor never sees a prefix in the address bar.
  it('sends an unauthenticated visitor from a private path to login', async () => {
    const response = await proxy(buildRequest('/en/home'));
    expect(new URL(locationOf(response)).pathname).toBe('/login');
  });

  // Bouncing to login must not lose where the user was going.
  it('preserves the intended destination as callbackUrl', async () => {
    const response = await proxy(buildRequest('/en/home'));
    expect(locationOf(response)).toContain('callbackUrl=%2Fhome');
  });

  it('lets an authenticated visitor through to a private path', async () => {
    const response = await proxy(buildRequest('/en/home', { session: true }));
    expect(response.headers.get('location')).toBeNull();
  });

  it('routes the locale root by session presence', async () => {
    const signedOut = await proxy(buildRequest('/en'));
    const signedIn = await proxy(buildRequest('/en', { session: true }));

    expect(new URL(locationOf(signedOut)).pathname).toBe('/login');
    expect(new URL(locationOf(signedIn)).pathname).toBe('/home');
  });
});

describe('public paths', () => {
  it.each(['/en/login', '/en/forgot-password', '/en/auth/google/callback'])(
    'allows %s without a session',
    async (path) => {
      const response = await proxy(buildRequest(path));
      expect(response.headers.get('location')).toBeNull();
    }
  );

  it('sends a signed-in user away from login', async () => {
    const response = await proxy(buildRequest('/en/login', { session: true }));
    expect(new URL(locationOf(response)).pathname).toBe('/home');
  });

  // change-password is reachable while signed in — it is the one public path
  // that must not bounce an authenticated user away.
  it('keeps change-password reachable while signed in', async () => {
    const response = await proxy(buildRequest('/en/change-password', { session: true }));
    expect(response.headers.get('location')).toBeNull();
  });
});

describe('what the middleware deliberately does not do', () => {
  // Presence is all it checks. If this ever starts validating the cookie, the
  // opaque-session model has been broken: only the backend can judge it.
  it('treats any non-empty cookie as present without validating it', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/en/home'));
    request.cookies.set(SESSION_COOKIE, 'obviously-not-a-real-session');

    const response = await proxy(request);
    expect(response.headers.get('location')).toBeNull();
  });
});
