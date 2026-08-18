import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `forwardSessionCookies` re-emits the backend's Set-Cookie headers onto the
 * Next.js response. It is the single point where the session cookie's security
 * flags cross from one codebase to the other, so a parsing slip here silently
 * downgrades HttpOnly or Secure on a live credential.
 */

const cookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(cookieStore),
}));

const { forwardSessionCookies, clearSessionCookie, SESSION_COOKIE, CSRF_COOKIE } = await import('@/lib/api/session');

describe('forwardSessionCookies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves HttpOnly, Secure and SameSite rather than reconstructing them', async () => {
    await forwardSessionCookies(['session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800']);

    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    const [name, value, options] = cookieStore.set.mock.calls[0];

    expect(name).toBe('session');
    expect(value).toBe('abc123');
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 604800,
    });
  });

  // The flags are opt-in: a header without them must not be treated as though
  // it had them, or the test above would pass on a parser that hardcodes true.
  it('does not invent flags the backend did not send', async () => {
    await forwardSessionCookies(['session=abc123; Path=/']);

    const [, , options] = cookieStore.set.mock.calls[0];
    expect(options.httpOnly).toBe(false);
    expect(options.secure).toBe(false);
  });

  it('forwards the session and CSRF cookies together', async () => {
    await forwardSessionCookies([
      'session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax',
      'csrf_token=tok456; Path=/; Secure; SameSite=Lax',
    ]);

    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    const names = cookieStore.set.mock.calls.map((call) => call[0]);
    expect(names).toEqual(['session', 'csrf_token']);
  });

  // The CSRF token has to stay readable — the client echoes it back in a
  // header, which a cross-site page cannot do.
  it('keeps the CSRF cookie readable while the session stays httpOnly', async () => {
    await forwardSessionCookies([
      'session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax',
      'csrf_token=tok456; Path=/; Secure; SameSite=Lax',
    ]);

    const [, , sessionOptions] = cookieStore.set.mock.calls[0];
    const [, , csrfOptions] = cookieStore.set.mock.calls[1];

    expect(sessionOptions.httpOnly).toBe(true);
    expect(csrfOptions.httpOnly).toBe(false);
  });

  it('handles a value containing "=" without truncating it', async () => {
    await forwardSessionCookies(['session=a=b=c; Path=/']);

    const [, value] = cookieStore.set.mock.calls[0];
    expect(value).toBe('a=b=c');
  });

  it('ignores a malformed header instead of throwing', async () => {
    await forwardSessionCookies(['not-a-cookie']);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('does nothing when the backend sent no cookies', async () => {
    await forwardSessionCookies([]);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it.each([
    ['SameSite=Strict', 'strict'],
    ['SameSite=None', 'none'],
    ['SameSite=Lax', 'lax'],
  ])('maps %s', async (attribute, expected) => {
    await forwardSessionCookies([`session=abc; Path=/; ${attribute}`]);
    const [, , options] = cookieStore.set.mock.calls[0];
    expect(options.sameSite).toBe(expected);
  });
});

describe('clearSessionCookie', () => {
  beforeEach(() => vi.clearAllMocks());

  // Leaving the CSRF cookie behind would strand a token belonging to a session
  // that no longer exists.
  it('clears both the session and CSRF cookies', async () => {
    await clearSessionCookie();

    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE);
    expect(cookieStore.delete).toHaveBeenCalledWith(CSRF_COOKIE);
  });
});
