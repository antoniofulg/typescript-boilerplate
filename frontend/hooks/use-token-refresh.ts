'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

/**
 * Hook to automatically refresh JWT tokens before they expire
 *
 * This hook:
 * - Monitors the current token expiration time
 * - Automatically refreshes the token when it's close to expiring
 * - Prevents unexpected logouts due to expired tokens
 *
 * @param refreshThresholdMs - Time in milliseconds before expiration to trigger refresh (default: 40 minutes for 16h tokens)
 * @param checkIntervalMs - Interval in milliseconds to check token expiration (default: 5 minutes)
 */
export function useTokenRefresh(
  refreshThresholdMs: number = 40 * 60 * 1000, // 40 minutes (proportional to 16h token)
  checkIntervalMs: number = 5 * 60 * 1000, // 5 minutes
) {
  const { token } = useAuth();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshToken = useCallback(async () => {
    if (!token || isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;

      const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If refresh fails (401/403), the token is invalid or expired
        // Clear token to trigger logout
        if (response.status === 401 || response.status === 403) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            document.cookie =
              'auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            // Dispatch logout event to notify AuthContext
            window.dispatchEvent(new CustomEvent('token-expired'));
          }
        }
        // The AuthContext will handle cleanup on next request
        return;
      }

      const data = await response.json();

      // Update token in localStorage and cookie
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.accessToken);
        document.cookie = `auth_token=${data.accessToken}; path=/; max-age=57600; SameSite=Lax`;
      }

      // Trigger a page reload or update the context
      // Since we can't directly update the AuthContext state from here,
      // we'll dispatch a custom event that the AuthContext can listen to
      window.dispatchEvent(
        new CustomEvent('token-refreshed', {
          detail: { token: data.accessToken },
        }),
      );
    } catch {
      // Silently fail - the token will be refreshed on next check
      // or the user will be logged out on next request
    } finally {
      isRefreshingRef.current = false;
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      // Clear any existing timeouts/intervals
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    let isMounted = true;

    // Dynamic import to avoid SSR issues
    void import('@/lib/jwt-utils').then(
      ({ getTokenExpirationTime, shouldRefreshToken }) => {
        if (!isMounted || !token) return;

        const scheduleRefresh = () => {
          if (!token || !isMounted) return;

          const expirationTime = getTokenExpirationTime(token);
          if (!expirationTime) {
            // Can't determine expiration, check periodically
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
            }
            checkIntervalRef.current = setInterval(() => {
              if (!token || !isMounted) return;
              if (shouldRefreshToken(token, refreshThresholdMs)) {
                void refreshToken();
              }
            }, checkIntervalMs);
            return;
          }

          const now = Date.now();
          const timeUntilExpiration = expirationTime - now;
          const timeUntilRefresh = timeUntilExpiration - refreshThresholdMs;

          if (timeUntilRefresh <= 0) {
            // Token should be refreshed immediately
            void refreshToken();
          } else {
            // Clear existing timeout
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current);
            }
            // Schedule refresh for when threshold is reached
            refreshTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                void refreshToken();
              }
            }, timeUntilRefresh);

            // Also set up a periodic check as a fallback
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
            }
            checkIntervalRef.current = setInterval(() => {
              if (!token || !isMounted) return;
              if (shouldRefreshToken(token, refreshThresholdMs)) {
                void refreshToken();
              }
            }, checkIntervalMs);
          }
        };

        scheduleRefresh();
      },
    );

    return () => {
      isMounted = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [token, refreshThresholdMs, checkIntervalMs, refreshToken]);
}
