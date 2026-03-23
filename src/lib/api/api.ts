import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { ApiError, ApiMethod } from '@/lib/api/types';

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  cache?: RequestCache;
  revalidate?: number | false;
  tags?: string[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = (body as { message?: string }).message || response.statusText;
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export async function Api<T>(method: ApiMethod, url: string, options: ApiOptions = {}): Promise<T> {
  const { params, data, cache, revalidate, tags } = options;

  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const path = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = new URL(`${base}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      fullUrl.searchParams.append(key, String(value));
    });
  }

  // Read tokens from cookies
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const accessToken = cookieStore.get('access_token')?.value;

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  // if (refreshToken) {
  //   headers['Cookie'] = `refresh_token=${refreshToken}`;
  // }

  const fetchOptions: RequestInit = {
    method: method.toUpperCase(),
    headers,
    credentials: 'include',
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

  let response = await fetch(fullUrl.toString(), fetchOptions);

  // On 401, try to refresh the access token and retry once
  if (response.status === 401 && refreshToken) {
    const newAccessToken = await refreshAccessToken(refreshToken);
    if (newAccessToken) {
      (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(fullUrl.toString(), fetchOptions);
    }
  }

  return handleResponse<T>(response);
}

export const api = {
  auth: {
    async login(email: string, password: string) {
      const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      const response = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = (body as { message?: string }).message || response.statusText;
        throw new ApiError(message, response.status);
      }

      const data = (await response.json()) as import('@/lib/types/auth').LoginResponse;
      const setCookieHeaders = response.headers.getSetCookie();

      return { data, setCookieHeaders };
    },

    async me() {
      return Api<{
        statusCode: number;
        message: string;
        data: import('@/lib/types/auth').User;
      }>('GET', '/auth/me', {
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
 * Store the access token in an HttpOnly cookie.
 */
export async function setAccessTokenCookie(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes (short-lived, matches typical JWT expiry)
  });
}

/**
 * Call /auth/refresh with the refresh_token cookie to get a new access token.
 * Returns the new access token or null if refresh failed.
 */
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const response = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refresh_token=${refreshToken}`,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { accessToken: string };
    await setAccessTokenCookie(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

/**
 * Read user data from the user_data cookie (set at login).
 */
export async function getUserFromCookie(): Promise<import('@/lib/types/auth').User | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('user_data')?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as import('@/lib/types/auth').User;
  } catch {
    return null;
  }
}

/**
 * Store user data in a cookie so subsequent page loads avoid calling /auth/me.
 */
export async function setUserCookie(user: import('@/lib/types/auth').User): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('user_data', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Delete the user_data cookie (on logout).
 */
export async function deleteUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('user_data');
}

/**
 * Get the authenticated user. Reads from cookie first (zero API calls),
 * falls back to /auth/me only when the cookie is missing.
 * Cached per-request via React cache() to avoid duplicate fallback calls.
 */
export const getAuthUser = cache(async (): Promise<import('@/lib/types/auth').User> => {
  // 1. Try cookie first — no network request
  const cached = await getUserFromCookie();
  if (cached) return cached;

  // 2. Fallback: call /auth/me and persist for next request
  const meRes = await api.auth.me();
  await setUserCookie(meRes.data);
  return meRes.data;
});

export { ApiError };
