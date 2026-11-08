import type { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export interface CookieConfig {
  isProduction: boolean;
  domain?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
}

/**
 * Returns security-hardened options for the HttpOnly Refresh Token cookie.
 * - httpOnly: true prevents client-side JavaScript access (immune to XSS attacks).
 * - secure: true ensures transmission over HTTPS only (false in dev over HTTP).
 * - sameSite: 'lax' for same-site/subdomains; 'none' for cross-domain production.
 * - path: '/api/v1/auth' scopes the cookie strictly to auth endpoints.
 * - maxAge: 7 days in milliseconds (matches JWT_REFRESH_EXPIRATION).
 */
export function getRefreshCookieOptions(config: boolean | CookieConfig): CookieOptions {
  const isProd = typeof config === 'boolean' ? config : config.isProduction;
  const sameSite =
    typeof config === 'object' && config.sameSite
      ? config.sameSite
      : isProd
        ? 'lax'
        : 'lax';
  const secure =
    typeof config === 'object' && config.secure !== undefined
      ? config.secure
      : isProd;
  const domain = typeof config === 'object' ? config.domain : undefined;

  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  if (domain) {
    options.domain = domain;
  }

  return options;
}

/**
 * Returns matching options to clear the HttpOnly Refresh Token cookie on logout.
 */
export function getClearRefreshCookieOptions(config: boolean | CookieConfig): CookieOptions {
  const isProd = typeof config === 'boolean' ? config : config.isProduction;
  const sameSite =
    typeof config === 'object' && config.sameSite
      ? config.sameSite
      : isProd
        ? 'lax'
        : 'lax';
  const secure =
    typeof config === 'object' && config.secure !== undefined
      ? config.secure
      : isProd;
  const domain = typeof config === 'object' ? config.domain : undefined;

  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/v1/auth',
  };

  if (domain) {
    options.domain = domain;
  }

  return options;
}
