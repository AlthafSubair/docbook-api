import type { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

/**
 * Returns security-hardened options for the HttpOnly Refresh Token cookie.
 * - httpOnly: true prevents client-side JavaScript access (immune to XSS attacks).
 * - secure: true in production ensures the cookie is transmitted only over HTTPS.
 * - sameSite: 'lax' for local development; 'strict' (or 'none' for cross-domain) in production.
 * - path: '/api/v1/auth' scopes the cookie strictly to auth endpoints.
 * - maxAge: 7 days in milliseconds (matches JWT_REFRESH_EXPIRATION).
 */
export function getRefreshCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

/**
 * Returns matching options to clear the HttpOnly Refresh Token cookie on logout.
 */
export function getClearRefreshCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/v1/auth',
  };
}
