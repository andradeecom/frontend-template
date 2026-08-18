import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n, getLocale, hasLocale } from '@/lib/i18n';
import { SESSION_COOKIE } from '@/lib/api/session';

const publicPaths = ['/login', '/forgot-password', '/change-password', '/auth/google/callback'];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const detectedLocale = getLocale(request);
    const locale = detectedLocale && hasLocale(detectedLocale) ? detectedLocale : i18n.defaultLocale;
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    const qs = searchParams.toString();
    if (qs) newUrl.search = qs;
    return NextResponse.redirect(newUrl);
  }

  const [, locale, ...rest] = pathname.split('/');
  const subPath = rest.length ? `/${rest.join('/')}` : '/';

  /*
   * Routing only asks "is a session cookie present?" — it never tries to
   * interpret it. The cookie is opaque and only the backend can say whether it
   * is still valid, so this is a cheap redirect hint, not an authorization
   * decision. Every page that shows real data calls `getAuthUser()`, which is
   * where authorization is actually enforced.
   */
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (subPath === '/') {
    const destination = hasSession ? `/${locale}/home` : `/${locale}/login`;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const isPublicPath = publicPaths.some((path) => subPath === path || subPath.startsWith(`${path}/`));

  if (!isPublicPath && !hasSession) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath && hasSession && !subPath.startsWith('/change-password')) {
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
