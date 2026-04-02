import type { User } from '@/lib/types/auth';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from '@/lib/auth-config';

/**
 * Client-side cookie utilities for auth tokens and user data.
 * These set non-httpOnly cookies so both client JS and the Next.js server can read them.
 * The refresh_token is handled as an httpOnly cookie set directly by the backend.
 */

export function setAccessTokenClient(accessToken: string): void {
  document.cookie = `access_token=${accessToken}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Lax; Secure`;
}

export function setUserClient(user: User): void {
  const encoded = encodeURIComponent(JSON.stringify(user));
  document.cookie = `user_data=${encoded}; path=/; max-age=${REFRESH_TOKEN_MAX_AGE}; SameSite=Lax; Secure`;
}

export function clearAuthClient(): void {
  document.cookie = 'access_token=; path=/; max-age=0';
  document.cookie = 'user_data=; path=/; max-age=0';
}
