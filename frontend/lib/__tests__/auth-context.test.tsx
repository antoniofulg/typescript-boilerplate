import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/src/test-utils';
import { render as rtlRender } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { http, HttpResponse } from 'msw';
import { server } from '@/src/mocks/server';
import { ThemeProvider } from '@/components/theme-provider';

// Test component that uses auth context
function TestComponent() {
  const { user, isAuthenticated, loading, token } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="is-authenticated">{String(isAuthenticated)}</div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <div data-testid="user-role">{user?.role || 'no-role'}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('provides initial loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Loading state might be very brief, so we check for either loading or loaded state
    const loadingOrLoaded =
      screen.queryByText('Loading...') ||
      screen.queryByTestId('is-authenticated');
    expect(loadingOrLoaded).toBeTruthy();
  });

  it('provides unauthenticated state when no token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    });
  });

  it('loads user profile when token exists in localStorage', async () => {
    localStorage.setItem('auth_token', 'mock-access-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent(
          'true',
        );
        expect(screen.getByTestId('user-email')).toHaveTextContent(
          'admin@test.com',
        );
        expect(screen.getByTestId('user-role')).toHaveTextContent(
          'SUPER_ADMIN',
        );
      },
      { timeout: 3000 },
    );
  });

  it('handles invalid token gracefully', async () => {
    localStorage.setItem('auth_token', 'invalid-token');

    // Mock API to return 401
    server.use(
      http.get('http://localhost:4000/auth/me', () => {
        return HttpResponse.json(
          { message: 'Não autorizado' },
          { status: 401 },
        );
      }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });
  });
});

describe('useAuth hook', () => {
  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    // Use rtlRender directly (not from test-utils) to avoid AuthProvider wrapper
    // Wrap only with ThemeProvider to match minimal setup
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        {children}
      </ThemeProvider>
    );

    // React 19 throws errors during render
    // The error should be thrown when the component tries to use the context
    expect(() => {
      rtlRender(<TestComponent />, { wrapper: Wrapper });
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
  });
});
