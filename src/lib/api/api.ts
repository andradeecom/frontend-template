import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError, ApiMethod, ApiOptions } from '@/lib/api/types';
import { handleResponse } from '@/lib/api/utils';
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE, getCsrfToken, getSessionCookie } from '@/lib/api/session';
import { Locale, supportedLocales } from '@/lib/i18n';

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function apiBase(): string {
  return API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
}

/**
 * Server-side API caller — the "backend for frontend" hop.
 *
 * Requests originate on the Next.js server, which forwards the opaque session
 * cookie upstream. No credential is ever handed to the browser, so there is
 * nothing for page JavaScript (or an injected script) to read or exfiltrate.
 */
export async function Api<T>(method: ApiMethod, url: string, options: ApiOptions = {}): Promise<T> {
  const { params, data, cache, revalidate, tags } = options;

  const path = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = new URL(`${apiBase()}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      fullUrl.searchParams.append(key, String(value));
    });
  }

  const sessionId = await getSessionCookie();
  const csrfToken = await getCsrfToken();

  const reqHeaders: HeadersInit = { 'Content-Type': 'application/json' };

  const cookieParts: string[] = [];
  if (sessionId) cookieParts.push(`${SESSION_COOKIE}=${sessionId}`);
  if (csrfToken) cookieParts.push(`${CSRF_COOKIE}=${csrfToken}`);
  if (cookieParts.length) reqHeaders['Cookie'] = cookieParts.join('; ');

  // Echo the token back in a header. The backend accepts the mutation only when
  // header and cookie match — something only a same-origin caller can arrange.
  if (csrfToken) reqHeaders[CSRF_HEADER] = csrfToken;

  const fetchOptions: RequestInit = {
    method: method.toUpperCase(),
    headers: reqHeaders,
  };

  const isGetRequest = method.toUpperCase() === 'GET';

  if (data && !isGetRequest) {
    fetchOptions.body = JSON.stringify(data);
  }

  if (isGetRequest) {
    if (cache === 'no-store') {
      fetchOptions.cache = 'no-store';
      if (tags) fetchOptions.next = { tags };
    } else {
      fetchOptions.cache = cache || 'force-cache';
      fetchOptions.next = {
        revalidate: revalidate !== undefined ? revalidate : 3600,
        ...(tags && { tags }),
      };
    }
  } else {
    fetchOptions.cache = cache || 'no-store';
  }

  let response: Response;

  try {
    response = await fetch(fullUrl.toString(), fetchOptions);
  } catch (cause) {
    /*
     * `fetch` rejects (rather than returning a status) when the request never
     * reached the API at all — the usual cause in development being that the
     * backend simply is not running. Node surfaces that as a bare
     * "fetch failed", which says nothing actionable, so it is re-thrown with
     * the URL that was refused.
     */
    throw new ApiError(
      `Cannot reach the API at ${apiBase()} — is the backend running? (${method.toUpperCase()} ${path})`,
      503,
      { cause }
    );
  }

  // There is no token to refresh: a 401 means the session row is gone, so the
  // only correct move is to send the user back to login. Cookies cannot be
  // mutated during an RSC render, so the deletion is delegated to a Route
  // Handler.
  if (response.status === 401) {
    const headerStore = await headers();
    const referer = headerStore.get('referer') || '';
    let locale = referer.match(/\/([a-z]{2})\//)?.[1];
    if (!locale || !supportedLocales.includes(locale as Locale)) locale = 'en';

    const host = headerStore.get('host') || 'localhost';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    await fetch(`${protocol}://${host}/api/auth/force-logout?locale=${locale}`, { method: 'POST' });

    redirect('/login');
  }

  return handleResponse<T>(response);
}

export const api = {
  auth: {
    // `/auth/me` returns the user object directly, unlike the `/users` routes
    // which wrap theirs in `{ statusCode, message, data }`.
    async me() {
      return Api<import('@/lib/types/auth').User>('GET', '/auth/me', {
        cache: 'no-store',
      });
    },

    async changePassword(payload: import('@/lib/types/auth').ChangePasswordPayload) {
      return Api<import('@/lib/types/auth').MessageResponse>('POST', '/auth/change-password', {
        data: payload,
        cache: 'no-store',
      });
    },

    async forgotPassword(email: string) {
      return Api<import('@/lib/types/auth').MessageResponse>('POST', '/auth/forgot-password', {
        data: { email },
        cache: 'no-store',
      });
    },

    async logout() {
      return Api<import('@/lib/types/auth').MessageResponse>('POST', '/auth/logout', {
        cache: 'no-store',
      });
    },
  },
};

/**
 * The authenticated user for the current request.
 *
 * Always read from the backend rather than a client-visible cookie: the user's
 * role drives authorization decisions, and a value the browser can edit is not
 * a safe basis for those. React `cache()` collapses this to one call per
 * request.
 */
export const getAuthUser = cache(async (): Promise<import('@/lib/types/auth').User> => {
  return api.auth.me();
});

export { ApiError };
