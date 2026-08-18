'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { i18n, hasLocale } from '@/lib/i18n/i18n-config';

// Not exported: a "use server" file may only export async functions.
const LOCALE_COOKIE = 'locale';

/**
 * Records an explicit language choice.
 *
 * The middleware prefers this cookie over `Accept-Language`, so choosing a
 * language sticks even when the browser asks for a different one. Validated
 * against the supported list rather than trusted: the value arrives from a form
 * and is interpolated into a path, so an unchecked value would let a caller
 * steer the rewrite.
 */
export async function setLocale(formData: FormData): Promise<void> {
  const requested = formData.get('locale');
  const locale = typeof requested === 'string' && hasLocale(requested) ? requested : i18n.defaultLocale;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  /*
   * The rendered page is locale-specific, so it has to be re-fetched. Return
   * the visitor to the page they were on — switching language on the login
   * screen should not deposit them on /home — and strip any locale prefix so
   * the middleware rewrites the path with the new preference.
   */
  redirect(await currentPath());
}

/**
 * The path the switcher was submitted from, taken from the Referer header and
 * stripped of any locale prefix.
 *
 * Referer is client-supplied, so only its pathname is used, and only after
 * confirming it parses and points at a path — never the host. Anything
 * unexpected falls back to the site root.
 */
async function currentPath(): Promise<string> {
  const headerStore = await headers();
  const referer = headerStore.get('referer');
  if (!referer) return '/';

  let pathname: string;
  try {
    pathname = new URL(referer).pathname;
  } catch {
    return '/';
  }

  const [, maybeLocale, ...rest] = pathname.split('/');
  const stripped = hasLocale(maybeLocale) ? `/${rest.join('/')}` : pathname;

  // A bare "/" would be gated straight back to /home or /login, which is the
  // desired behaviour, so no special case is needed here.
  return stripped === '/' || stripped === '' ? '/' : stripped;
}
