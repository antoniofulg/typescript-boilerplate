import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Mock user data
const mockUser = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'SUPER_USER' as const,
  tenantId: undefined,
};

// Mock handlers for API endpoints
export const handlers = [
  // Mock GET /api/tenants
  http.get(`${API_URL}/tenants`, () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Tenant 1',
        slug: 'tenant-1',
        status: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        name: 'Tenant 2',
        slug: 'tenant-2',
        status: 'ACTIVE',
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ]);
  }),

  // Mock POST /auth/login
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'admin@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        user: mockUser,
      });
    }
    return HttpResponse.json(
      { message: 'Credenciais inválidas' },
      { status: 401 },
    );
  }),

  // Mock POST /auth/register
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
      role: string;
    };
    if (body.email === 'existing@test.com') {
      return HttpResponse.json(
        { message: 'Email já está em uso' },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      user: {
        ...mockUser,
        email: body.email,
        name: body.name,
        role: body.role,
      },
    });
  }),

  // Mock GET /auth/me
  http.get(`${API_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader === 'Bearer mock-access-token') {
      return HttpResponse.json(mockUser);
    }
    return HttpResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }),

  // Mock POST /auth/logout
  http.post(`${API_URL}/auth/logout`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Logout realizado com sucesso' });
    }
    return HttpResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }),

  // Mock GET /health
  http.get(`${API_URL}/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
