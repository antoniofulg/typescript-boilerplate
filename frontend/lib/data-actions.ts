'use server';

import { revalidatePath } from 'next/cache';
import { getAuthToken } from './auth-server';
import type { CreateTenantDto, UpdateTenantDto, Tenant } from '@/types/tenant';
import type { CreateUserDto, UpdateUserDto, User } from '@/types/user';

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

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

async function makeRequest<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  passwordConfirmation?: string,
): Promise<ActionResult<T>> {
  const token = await getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Não autenticado',
    };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const requestBody: Record<string, unknown> = body
      ? { ...(body as Record<string, unknown>) }
      : {};

    if (passwordConfirmation) {
      requestBody.passwordConfirmation = passwordConfirmation;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method,
      headers,
      body:
        Object.keys(requestBody).length > 0
          ? JSON.stringify(requestBody)
          : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage =
        error.message || `Erro ${response.status}: ${response.statusText}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Tenant Actions
export async function createTenantAction(
  data: CreateTenantDto,
): Promise<ActionResult<Tenant>> {
  const result = await makeRequest<Tenant>('/tenants', 'POST', data);

  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/users');
  }

  return result;
}

export async function updateTenantAction(
  id: string,
  data: UpdateTenantDto,
): Promise<ActionResult<Tenant>> {
  const result = await makeRequest<Tenant>(`/tenants/${id}`, 'PATCH', data);

  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/users');
  }

  return result;
}

export async function deleteTenantAction(
  id: string,
): Promise<ActionResult<void>> {
  const result = await makeRequest<void>(`/tenants/${id}`, 'DELETE');

  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/users');
  }

  return result;
}

// User Actions
export async function createUserAction(
  data: CreateUserDto,
): Promise<ActionResult<User>> {
  const result = await makeRequest<User>('/users', 'POST', data);

  if (result.success) {
    revalidatePath('/users');
    revalidatePath('/dashboard');
  }

  return result;
}

export async function updateUserAction(
  id: string,
  data: UpdateUserDto,
): Promise<ActionResult<User>> {
  const result = await makeRequest<User>(`/users/${id}`, 'PATCH', data);

  if (result.success) {
    revalidatePath('/users');
    revalidatePath('/dashboard');
  }

  return result;
}

export async function deleteUserAction(
  id: string,
  passwordConfirmation?: string,
): Promise<ActionResult<void>> {
  const result = await makeRequest<void>(
    `/users/${id}`,
    'DELETE',
    undefined,
    passwordConfirmation,
  );

  if (result.success) {
    revalidatePath('/users');
    revalidatePath('/dashboard');
  }

  return result;
}
