import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n, getLocale, hasLocale } from '@/lib/i18n';
import { SESSION_COOKIE } from '@/lib/api/session';

const publicPaths = ['/login', '/forgot-password', '/change-password', '/auth/google/callback'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  /*
   * Add the locale by rewriting rather than redirecting: the visitor keeps the
   * locale-less URL and is served the localised route directly, saving a round
   * trip. Session gating below still runs on the rewritten path, so an
   * unauthenticated visitor to `/home` is bounced to login rather than being
   * quietly served a page that would fail at `getAuthUser()`.
   */
  if (!pathnameHasLocale) {
    /*
     * An explicit choice from the language selector wins over Accept-Language.
     * Without this the selector would appear to do nothing for anyone whose
     * browser asks for a different language — negotiation would simply
     * overrule them on the next request.
     */
    const chosen = request.cookies.get('locale')?.value;
    const detected = chosen && hasLocale(chosen) ? chosen : getLocale(request);
    const locale = detected && hasLocale(detected) ? detected : i18n.defaultLocale;
    const localised = `/${locale}${pathname === '/' ? '' : pathname}`;

    const gate = gateSession(request, localised);
    if (gate) return gate;

    const url = request.nextUrl.clone();
    url.pathname = localised;

    const response = NextResponse.rewrite(url);
    // Remember the negotiated locale so it stays stable across requests. An
    // explicit choice is already stored by `setLocale`, so only write when the
    // visitor has not chosen one — otherwise this would overwrite it.
    if (!chosen) response.cookies.set('locale', locale);
    return response;
  }

  return gateSession(request, pathname) ?? NextResponse.next();
}

/**
 * Redirect hint only — never authorization.
 *
 * This asks whether a session cookie is *present*, not whether it is valid: the
 * id is opaque and only the backend can judge it. Real enforcement is
 * `getAuthUser()` on the page, which is what makes a forged cookie useless.
 * The point here is UX — bouncing a signed-out visitor straight to login
 * instead of letting the page render and fail.
 */
function gateSession(request: NextRequest, resolvedPath: string) {
  const rest = resolvedPath.split('/').slice(2);
  const subPath = rest.length ? `/${rest.join('/')}` : '/';
  const hasSession = request.cookies.has(SESSION_COOKIE);

  /*
   * Redirect targets are locale-less so the middleware rewrites them on the
   * way back, keeping the prefix out of the address bar. Using `/${locale}/…`
   * here would pin it — the same thing the Server Action redirects had to stop
   * doing.
   */
  if (subPath === '/') {
    return NextResponse.redirect(new URL(hasSession ? '/home' : '/login', request.url));
  }

  const isPublicPath = publicPaths.some((path) => subPath === path || subPath.startsWith(`${path}/`));

  if (!isPublicPath && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    // The locale-less path, so the visitor returns to a clean URL after login.
    loginUrl.searchParams.set('callbackUrl', subPath);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath && hasSession && !subPath.startsWith('/change-password')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return null;
}

export const config = {
  // sitemap.xml and robots.txt must stay unprefixed: they are served from the
  // app root, so rewriting them to /<locale>/sitemap.xml would 404.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
