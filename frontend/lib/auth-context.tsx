'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'USER';
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  getProfile: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'OPERATOR' | 'USER';
  tenantId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted first to avoid hydration issues
    // This is a common pattern to prevent hydration mismatches

    setMounted(true);

    // Carregar token do localStorage ao inicializar
    // Only access localStorage after component has mounted (client-side only)
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        // Tentar carregar perfil do usuário
        void loadUserProfile(storedToken).catch(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token inválido, remover
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          document.cookie = 'auth_token=; path=/; max-age=0';
        }
        setToken(null);
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        document.cookie = 'auth_token=; path=/; max-age=0';
      }
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

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
      throw new Error(error.message || 'Erro ao fazer login');
    }

    const data = await response.json();
    setToken(data.accessToken);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.accessToken);
      // Também salvar em cookie para server-side
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
      throw new Error(error.message || 'Erro ao registrar');
    }

    const data = await response.json();
    setToken(data.accessToken);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.accessToken);
      // Também salvar em cookie para server-side
      document.cookie = `auth_token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Remover cookie também
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
        loading: !mounted || loading, // Show loading during hydration
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
