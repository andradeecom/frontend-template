import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `setLocale` writes the language preference the middleware reads. Two things
 * matter: the value is validated (it steers a rewrite path), and the visitor
 * returns to the page they were on rather than a hardcoded destination.
 */

const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
const headerStore = { get: vi.fn() };
const redirect = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(cookieStore),
  headers: () => Promise.resolve(headerStore),
}));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirect(path),
  notFound: () => {
    throw new Error('notFound');
  },
}));

const { setLocale } = await import('@/actions/locale');

const submit = (locale: unknown, referer: string | null = 'http://localhost:3000/pt/home') => {
  headerStore.get.mockReturnValue(referer);
  const formData = new FormData();
  if (locale !== undefined) formData.set('locale', locale as string);
  return setLocale(formData);
};

describe('setLocale', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stores a supported locale', async () => {
    await submit('es');

    const [name, value, options] = cookieStore.set.mock.calls[0];
    expect(name).toBe('locale');
    expect(value).toBe('es');
    expect(options).toMatchObject({ path: '/', sameSite: 'lax' });
  });

  // The value arrives from a form and is interpolated into a rewrite path, so
  // an unvalidated one would let a caller steer routing.
  it.each([['klingon'], ['../../etc/passwd'], ['']])('falls back to the default for %s', async (value) => {
    await submit(value);
    expect(cookieStore.set.mock.calls[0][1]).toBe('en');
  });

  it('falls back to the default when no locale is submitted', async () => {
    await submit(undefined);
    expect(cookieStore.set.mock.calls[0][1]).toBe('en');
  });
});

describe('setLocale redirect target', () => {
  beforeEach(() => vi.clearAllMocks());

  // Switching language on the login screen must not deposit the visitor on
  // /home, which is what a hardcoded destination did.
  it('returns to the page the switcher was used on', async () => {
    await submit('es', 'http://localhost:3000/pt/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  // Locale-less so the middleware rewrites it with the new preference.
  it('strips the locale prefix from the return path', async () => {
    await submit('es', 'http://localhost:3000/pt/home');
    expect(redirect).toHaveBeenCalledWith('/home');
  });

  it('handles an already locale-less referer', async () => {
    await submit('es', 'http://localhost:3000/home');
    expect(redirect).toHaveBeenCalledWith('/home');
  });

  it.each([
    ['a bare locale root', 'http://localhost:3000/pt'],
    ['the site root', 'http://localhost:3000/'],
    ['a malformed referer', 'not-a-url'],
    ['no referer', null],
  ])('falls back to / for %s', async (_label, referer) => {
    await submit('es', referer);
    expect(redirect).toHaveBeenCalledWith('/');
  });
});
