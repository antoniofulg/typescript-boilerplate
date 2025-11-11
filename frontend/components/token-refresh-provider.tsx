'use client';

import { useTokenRefresh } from '@/hooks/use-token-refresh';

/**
 * Client component that handles automatic token refresh
 * This should be used inside AuthProvider
 */
export function TokenRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // This hook will automatically refresh tokens before they expire
  useTokenRefresh();

  return <>{children}</>;
}
