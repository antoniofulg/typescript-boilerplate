'use server';

import { cookies } from 'next/headers';

// Use the same logic as api-server to determine the backend URL
const getBackendUrl = (): string => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    const backendPort = process.env.BACKEND_PORT || '4000';
    return `http://backend:${backendPort}`;
  }

  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
};

const BACKEND_URL = getBackendUrl();

type LoginResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
  accessToken?: string;
  user?: {
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
};

type RegisterResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

type LogoutResult = {
  success: boolean;
  error?: string;
};

export async function loginAction(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
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
        return {
          success: false,
          error: error.message || 'Usuário já autenticado',
          redirectTo: error.redirectTo,
        };
      }

      return {
        success: false,
        error: error.message || 'Erro ao fazer login',
      };
    }

    const data = await response.json();

    // Set cookie with token
    const cookieStore = await cookies();
    cookieStore.set('auth_token', data.accessToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false, // Needs to be accessible from client for API calls
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Return success with redirect path, token, and user data
    // This allows the client to update AuthContext immediately
    return {
      success: true,
      redirectTo: data.user?.role === 'SUPER_USER' ? '/dashboard' : '/',
      accessToken: data.accessToken,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao fazer login',
    };
  }
}

export async function registerAction(data: {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'OPERATOR' | 'USER';
  tenantId?: string;
}): Promise<RegisterResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();

      // If user is already authenticated, handle redirect
      if (response.status === 403 && error.redirectTo) {
        return {
          success: false,
          error: error.message || 'Usuário já autenticado',
          redirectTo: error.redirectTo,
        };
      }

      return {
        success: false,
        error: error.message || 'Erro ao registrar',
      };
    }

    const result = await response.json();

    // Set cookie with token
    const cookieStore = await cookies();
    cookieStore.set('auth_token', result.accessToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false, // Needs to be accessible from client for API calls
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Return success with redirect path
    return {
      success: true,
      redirectTo: result.user?.role === 'SUPER_USER' ? '/dashboard' : '/',
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao registrar',
    };
  }
}

export async function logoutAction(): Promise<LogoutResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    // If no token, consider logout successful (already logged out)
    if (!token) {
      return {
        success: true,
      };
    }

    // Call logout endpoint to revoke token on backend
    const response = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // Remove cookie regardless of response status
    // This ensures the user is logged out on the frontend even if backend call fails
    cookieStore.delete('auth_token');

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Erro ao fazer logout',
      }));

      // Still return success since we've removed the cookie
      // The token is already invalidated on the frontend
      return {
        success: true,
        error: error.message || 'Erro ao fazer logout no servidor',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    // Even if there's an error, remove the cookie to ensure logout
    try {
      const cookieStore = await cookies();
      cookieStore.delete('auth_token');
    } catch {
      // Ignore errors when deleting cookie
    }

    return {
      success: true,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao fazer logout',
    };
  }
}
