import { getAuthToken } from './auth-server';
import type { Tenant } from '@/types/tenant';
import type { User } from '@/types/user';

// Use the same logic as auth-server to determine the backend URL
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
      cache: 'no-store', // Always fetch fresh data
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

export async function getUsers(): Promise<User[]> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('UNAUTHENTICATED');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const users = await response.json();
    return users;
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      throw error;
    }
    throw new Error('Failed to fetch users');
  }
}

export async function getUser(id: string): Promise<User> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('UNAUTHENTICATED');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const user = await response.json();
    return user;
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      throw error;
    }
    throw new Error('Failed to fetch user');
  }
}
