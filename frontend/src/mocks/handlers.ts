import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Mock handlers for API endpoints
export const handlers = [
  // Mock GET /api/tenants
  http.get(`${API_URL}/api/tenants`, () => {
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

  // Mock GET /health
  http.get(`${API_URL}/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
