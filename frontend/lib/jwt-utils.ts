/**
 * Utility functions for JWT token handling
 */

type JwtPayload = {
  userId: string;
  email?: string;
  role: string;
  tenantId?: string;
  exp: number;
  iat: number;
};

/**
 * Decodes a JWT token without verification
 * Note: This only decodes the payload, it does NOT verify the signature
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
}

/**
 * Gets the expiration time of a JWT token in milliseconds
 */
export function getTokenExpirationTime(token: string): number | null {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    return null;
  }

  // exp is in seconds, convert to milliseconds
  return payload.exp * 1000;
}

/**
 * Gets the time remaining until token expiration in milliseconds
 */
export function getTokenTimeRemaining(token: string): number | null {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return null;
  }

  const remaining = expirationTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Checks if a token should be refreshed
 * Returns true if the token expires within the specified threshold
 * @param token - JWT token to check
 * @param thresholdMs - Time in milliseconds before expiration to trigger refresh (default: 5 minutes)
 */
export function shouldRefreshToken(
  token: string,
  thresholdMs: number = 5 * 60 * 1000, // 5 minutes default
): boolean {
  const timeRemaining = getTokenTimeRemaining(token);
  if (timeRemaining === null) {
    return true; // If we can't determine, assume it needs refresh
  }

  // Refresh if remaining time is less than threshold
  return timeRemaining <= thresholdMs;
}
