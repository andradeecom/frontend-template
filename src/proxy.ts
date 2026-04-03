import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n, getLocale, hasLocale } from '@/lib/i18n';
import { ACCESS_TOKEN_MAX_AGE } from '@/lib/auth-config';

const publicPaths = ['/login', '/forgot-password', '/change-password'];

const API_BASE = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(
  /\/$/,
  ''
);

/**
 * Proactively refresh the access token when it's missing/expired
 * but a valid refresh_token cookie still exists.
 * Returns the new access token or null if refresh failed.
 */
async function tryRefreshToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refresh_token=${refreshToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { accessToken: string };
    return data.accessToken;
  } catch {
    return null;
  }
}

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

  // Check if user is authenticated by presence of refresh_token cookie
  const hasRefreshToken = request.cookies.has('refresh_token');

  if (subPath === '/') {
    const destination = hasRefreshToken ? `/${locale}/home` : `/${locale}/login`;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const isPublicPath = publicPaths.some((path) => subPath === path || subPath.startsWith(`${path}/`));

  if (!isPublicPath && !hasRefreshToken) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath && hasRefreshToken && !subPath.startsWith('/change-password')) {
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  // Proactive token refresh: if access_token is gone but refresh_token exists,
  // refresh now so downstream RSC code always has a valid access token.
  const hasAccessToken = request.cookies.has('access_token');
  if (!hasAccessToken && hasRefreshToken) {
    const refreshToken = request.cookies.get('refresh_token')!.value;
    const newAccessToken = await tryRefreshToken(refreshToken);

    if (newAccessToken) {
      const response = NextResponse.next();
      response.cookies.set('access_token', newAccessToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });
      return response;
    }

    // Refresh failed — token is truly expired, force logout via POST
    const logoutUrl = new URL(`/api/auth/force-logout?locale=${locale}`, request.url);
    await fetch(logoutUrl.toString(), { method: 'POST', headers: { Cookie: request.headers.get('cookie') || '' } });
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
