import { cookies } from 'next/headers';

// In Docker, use the backend service name in the same network
// In local development, use localhost
// NEXT_PUBLIC_BACKEND_URL is for the client, we need a URL for the server
const getBackendUrl = (): string => {
  // If there's a server-specific environment variable, use it
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  // If in Docker (NODE_ENV=production and localhost is not accessible),
  // use the Docker Compose service name
  if (process.env.NODE_ENV === 'production') {
    // Try to detect if we're in Docker by checking if hostname is the container name
    // or if there's a Docker environment variable
    const backendPort = process.env.BACKEND_PORT || '4000';
    // In Docker Compose, the service name 'backend' resolves to the container IP
    return `http://backend:${backendPort}`;
  }

  // In development, use localhost or NEXT_PUBLIC_BACKEND_URL
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
};

const BACKEND_URL = getBackendUrl();

export type User = {
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
      cache: 'no-store', // Always fetch fresh data
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

  if (user.role !== 'SUPER_USER') {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}
