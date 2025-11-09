import { getAuthToken } from './auth-server';
import type { Tenant } from '@/types/tenant';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function getTenants(): Promise<Tenant[]> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('UNAUTHENTICATED');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/tenants`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store', // Sempre buscar dados atualizados
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      throw new Error(`Failed to fetch tenants: ${response.status}`);
    }

    const tenants = await response.json();
    return tenants;
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      throw error;
    }
    throw new Error('Failed to fetch tenants');
  }
}
