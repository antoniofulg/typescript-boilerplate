import { cookies } from 'next/headers';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export type User = {
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
};

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store', // Sempre buscar dados atualizados
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user;
  } catch {
    return null;
  }
}

export async function requireSuperAdmin(): Promise<User> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}
