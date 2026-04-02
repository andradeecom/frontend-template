/** Access token cookie max-age in seconds (default: 15 minutes) */
export const ACCESS_TOKEN_MAX_AGE = Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_MAX_AGE || 900);

/** Refresh token cookie max-age in seconds (default: 7 days) */
export const REFRESH_TOKEN_MAX_AGE = Number(process.env.NEXT_PUBLIC_REFRESH_TOKEN_MAX_AGE || 604800);
