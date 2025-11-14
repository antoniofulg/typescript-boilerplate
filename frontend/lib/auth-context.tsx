'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { logoutAction } from './auth-actions';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_USER' | 'ADMIN' | 'OPERATOR' | 'USER';
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'OPERATOR' | 'USER';
  tenantId?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

type AuthProviderProps = {
  children: React.ReactNode;
  initialUser?: User | null;
  initialToken?: string | null;
};

export function AuthProvider({
  children,
  initialUser = null,
  initialToken = null,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(!initialUser && !initialToken);

  const loadUserProfile = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setLoading(false);
      } else {
        // Only clear token if it's a 401 (Unauthorized) - token is definitely invalid
        // For other errors (network, 500, etc), keep the token and user state
        if (response.status === 401) {
          // Invalid token, remove it
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            document.cookie = 'auth_token=; path=/; max-age=0';
          }
          setToken(null);
          setUser(null);
        }
        setLoading(false);
      }
    } catch {
      // On network errors, don't clear the token - it might be a temporary issue
      // Only clear if we're sure the token is invalid
      // Keep existing user state if available
      setLoading(false);
      // Don't clear token/user on network errors - might be temporary
    }
  }, []);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }

    // If we already have initial data from server, sync it and skip loading
    if (initialUser && initialToken) {
      // Sync token to localStorage and cookie
      localStorage.setItem('auth_token', initialToken);
      document.cookie = `auth_token=${initialToken}; path=/; max-age=604800; SameSite=Lax`;
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setLoading(false);
      }, 0);
      return;
    }

    // Carregar token do localStorage ou cookie ao inicializar
    // Helper function to get cookie value
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    };

    // Try to get token from localStorage first
    let storedToken = localStorage.getItem('auth_token');

    // If not in localStorage, try to get from cookie
    if (!storedToken) {
      const cookieToken = getCookie('auth_token');
      if (cookieToken) {
        storedToken = cookieToken;
        // Sync cookie to localStorage
        localStorage.setItem('auth_token', cookieToken);
      }
    } else {
      // If we have token in localStorage, sync to cookie if not present
      const cookieToken = getCookie('auth_token');
      if (!cookieToken) {
        document.cookie = `auth_token=${storedToken}; path=/; max-age=604800; SameSite=Lax`;
      }
    }

    // Use setTimeout to avoid synchronous setState in effect
    if (storedToken) {
      setTimeout(() => {
        setToken(storedToken);
        // Only load user profile if we don't already have it
        if (!user) {
          void loadUserProfile(storedToken).catch(() => {
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      }, 0);
    } else {
      // No token found, stop loading immediately
      setTimeout(() => {
        setLoading(false);
      }, 0);
    }

    // Listen for token refresh events
    const handleTokenRefresh = (event: CustomEvent<{ token: string }>) => {
      const newToken = event.detail.token;
      setToken(newToken);
      // Reload user profile with new token
      // Always try to reload profile when token is refreshed
      void loadUserProfile(newToken).catch(() => {
        // Silently fail - don't clear token on refresh failure
        // The user might still be valid, just couldn't fetch profile right now
      });
    };

    window.addEventListener(
      'token-refreshed',
      handleTokenRefresh as EventListener,
    );

    return () => {
      window.removeEventListener(
        'token-refreshed',
        handleTokenRefresh as EventListener,
      );
    };
  }, [loadUserProfile, initialUser, initialToken, user]);

  // If we have a token but no user, try to load the profile
  // This handles cases where the initial load failed but the token is still valid
  useEffect(() => {
    if (token && !user && !loading) {
      // Retry loading profile if we have token but no user
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setLoading(true);
        void loadUserProfile(token).catch(() => {
          // Silently fail - loading will be set to false in loadUserProfile
        });
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [token, user, loading, loadUserProfile]);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();

      // If user is already authenticated, handle redirect
      if (response.status === 403 && error.redirectTo) {
        // Update user state if user info is provided
        if (error.user) {
          setUser(error.user);
          // Try to get token from localStorage if available
          const existingToken =
            typeof window !== 'undefined'
              ? localStorage.getItem('auth_token')
              : null;
          if (existingToken) {
            setToken(existingToken);
          }
        }
        // Throw a special error with redirect info
        const redirectError = new Error(
          error.message || 'Usuário já autenticado',
        ) as Error & { redirectTo?: string };
        redirectError.redirectTo = error.redirectTo;
        throw redirectError;
      }

      throw new Error(error.message || 'Erro ao fazer login');
    }

    const data = await response.json();
    setToken(data.accessToken);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.accessToken);
      // Also save in cookie for server-side
      document.cookie = `auth_token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
    }
    return data;
  };

  const register = async (registerData: RegisterData) => {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const error = await response.json();

      // If user is already authenticated, handle redirect
      if (response.status === 403 && error.redirectTo) {
        // Update user state if user info is provided
        if (error.user) {
          setUser(error.user);
          // Try to get token from localStorage if available
          const existingToken =
            typeof window !== 'undefined'
              ? localStorage.getItem('auth_token')
              : null;
          if (existingToken) {
            setToken(existingToken);
          }
        }
        // Throw a special error with redirect info
        const redirectError = new Error(
          error.message || 'Usuário já autenticado',
        ) as Error & { redirectTo?: string };
        redirectError.redirectTo = error.redirectTo;
        throw redirectError;
      }

      throw new Error(error.message || 'Erro ao registrar');
    }

    const data = await response.json();
    setToken(data.accessToken);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.accessToken);
      // Also save in cookie for server-side
      document.cookie = `auth_token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  const logout = async () => {
    // Call server action to revoke token on backend
    // This ensures the token is invalidated server-side
    try {
      await logoutAction();
    } catch (error) {
      // Even if server action fails, continue with local logout
      // This ensures the user is logged out on the frontend
      console.error('Error calling logout action:', error);
    }

    // Clear local state regardless of server action result
    // This ensures logout works even if backend is unavailable
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Also remove cookie (fallback, server action already removes it)
      document.cookie = 'auth_token=; path=/; max-age=0';
    }
  };

  const getProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        getProfile,
        isAuthenticated: !!token && !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
