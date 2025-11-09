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

  useEffect(() => {
    // Carregar token do localStorage ao inicializar
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Tentar carregar perfil do usuário
      void loadUserProfile(storedToken).catch((error) => {
        console.error('Error loading user profile:', error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async (authToken: string) => {
    try {
      console.log('[Auth] Carregando perfil do usuário...');
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('[Auth] Perfil carregado com sucesso:', userData);
        setUser(userData);
      } else {
        console.error(
          '[Auth] Erro ao carregar perfil:',
          response.status,
          response.statusText,
        );
        // Token inválido, remover
        localStorage.removeItem('auth_token');
        setToken(null);
      }
    } catch (error) {
      console.error('[Auth] Erro ao carregar perfil:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[Auth] Fazendo login...', { email });
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Auth] Erro no login:', response.status, error);
      throw new Error(error.message || 'Erro ao fazer login');
    }

    const data = await response.json();
    console.log('[Auth] Login realizado com sucesso:', {
      user: data.user,
      hasToken: !!data.accessToken,
    });
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('auth_token', data.accessToken);
    return data;
  };

  const register = async (registerData: RegisterData) => {
    console.log('[Auth] Registrando novo usuário...', {
      email: registerData.email,
      role: registerData.role,
    });
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Auth] Erro no registro:', response.status, error);
      throw new Error(error.message || 'Erro ao registrar');
    }

    const data = await response.json();
    console.log('[Auth] Registro realizado com sucesso:', {
      user: data.user,
      hasToken: !!data.accessToken,
    });
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('auth_token', data.accessToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const getProfile = async () => {
    if (!token) return;

    try {
      console.log('[Auth] Buscando perfil do usuário...');
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('[Auth] Perfil obtido com sucesso:', userData);
        setUser(userData);
      } else {
        console.error(
          '[Auth] Erro ao buscar perfil:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('[Auth] Erro ao buscar perfil:', error);
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
