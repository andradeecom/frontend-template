/** Access token cookie max-age in seconds (default: 15 minutes) */
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 900;
const parsedAccessTokenMaxAge = parseInt(process.env.NEXT_PUBLIC_ACCESS_TOKEN_MAX_AGE_MS ?? '', 10);
export const ACCESS_TOKEN_MAX_AGE = Number.isFinite(parsedAccessTokenMaxAge)
  ? parsedAccessTokenMaxAge
  : DEFAULT_ACCESS_TOKEN_MAX_AGE;

/** Refresh token cookie max-age in seconds (default: 7 days) */
const DEFAULT_REFRESH_TOKEN_MAX_AGE = 604800000;
const parsedRefreshTokenMaxAge = parseInt(process.env.NEXT_PUBLIC_REFRESH_TOKEN_MAX_AGE_MS ?? '', 10);
export const REFRESH_TOKEN_MAX_AGE = Number.isFinite(parsedRefreshTokenMaxAge)
  ? parsedRefreshTokenMaxAge
  : DEFAULT_REFRESH_TOKEN_MAX_AGE;
