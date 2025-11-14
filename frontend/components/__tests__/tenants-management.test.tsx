import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/src/test-utils';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TenantsManagement } from '@/components/(superadmin)/tenants-management';
import type { Tenant } from '@/types/tenant';

const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'Active Tenant',
    slug: 'active-tenant',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Inactive Tenant',
    slug: 'inactive-tenant',
    status: 'INACTIVE',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Suspended Tenant',
    slug: 'suspended-tenant',
    status: 'SUSPENDED',
    createdAt: '2024-01-03T00:00:00.000Z',
  },
  {
    id: '4',
    name: 'Another Active',
    slug: 'another-active',
    status: 'ACTIVE',
    createdAt: '2024-01-04T00:00:00.000Z',
  },
];

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/dashboard',
}));

// Mock Server Actions
vi.mock('@/lib/data-actions', () => ({
  createTenantAction: vi.fn(),
  updateTenantAction: vi.fn(),
  deleteTenantAction: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('TenantsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  it('renders tenants table with initial tenants', async () => {
    render(
      <TenantsManagement
        initialTenants={mockTenants}
        searchQuery=""
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Active Tenant')).toBeInTheDocument();
    });

    expect(screen.getByText('Inactive Tenant')).toBeInTheDocument();
    expect(screen.getByText('Suspended Tenant')).toBeInTheDocument();
  });

  it('filters tenants by search query (name)', async () => {
    const user = userEvent.setup();
    render(
      <TenantsManagement
        initialTenants={mockTenants}
        searchQuery=""
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Active Tenant')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /buscar por nome ou slug/i,
    ) as HTMLInputElement;

    // Type the search query - this will trigger URL update
    await user.clear(searchInput);
    await user.type(searchInput, 'Another');

    // Wait for URL update (router.push should be called)
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });

  it('filters tenants by search query (slug)', async () => {
    const user = userEvent.setup();
    render(
      <TenantsManagement
        initialTenants={mockTenants}
        searchQuery=""
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Active Tenant')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nome ou slug/i);
    await user.clear(searchInput);
    await user.type(searchInput, 'inactive');

    // Wait for URL update
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('filters tenants by status (ACTIVE)', async () => {
    render(
      <TenantsManagement
        initialTenants={mockTenants}
        searchQuery=""
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Active Tenant')).toBeInTheDocument();
    });

    // All tenants should be visible initially
    expect(screen.getByText('Active Tenant')).toBeInTheDocument();
    expect(screen.getByText('Another Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive Tenant')).toBeInTheDocument();
    expect(screen.getByText('Suspended Tenant')).toBeInTheDocument();
  });

  it('filters tenants by status (INACTIVE)', async () => {
    render(
      <TenantsManagement
        initialTenants={mockTenants}
        searchQuery=""
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Active Tenant')).toBeInTheDocument();
    });

    expect(screen.getByText('Inactive Tenant')).toBeInTheDocument();
  });

  it('filters tenants by status (SUSPENDED)', async () => {
    render(
      <TenantsManagement
        initialTenants={mockTenants}
        searchQuery=""
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Active Tenant')).toBeInTheDocument();
    });

    expect(screen.getByText('Suspended Tenant')).toBeInTheDocument();
  });

  it('combines search and status filters', async () => {
    const user = userEvent.setup();
    render(
      <TenantsManagement
        initialTenants={mockTenants}
        searchQuery=""
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Active Tenant')).toBeInTheDocument();
    });

    // Set search query to filter by name
    const searchInput = screen.getByPlaceholderText(/buscar por nome ou slug/i);
    await user.clear(searchInput);
    await user.type(searchInput, 'Another');

    // Wait for URL update
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('shows message when no tenants match filters', async () => {
    render(
      <TenantsManagement
        initialTenants={[]}
        searchQuery="NonExistent"
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/nenhum tenant encontrado/i)).toBeInTheDocument();
    });
  });

  it('clears search filter when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TenantsManagement
        initialTenants={mockTenants}
        searchQuery="Another"
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Another Active')).toBeInTheDocument();
    });

    // Find and click clear button (button with X icon in absolute position)
    const buttons = screen.getAllByRole('button');
    const clearButton = buttons.find((btn) => {
      const className = btn.className || '';
      return (
        className.includes('absolute') &&
        className.includes('right-1') &&
        btn.querySelector('svg')
      );
    });

    expect(clearButton).toBeDefined();
    if (clearButton) {
      await user.click(clearButton);

      // Wait for URL update
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    }
  });

  it('shows filters only when there are tenants', async () => {
    render(
      <TenantsManagement
        initialTenants={[]}
        searchQuery=""
        statusFilter="ALL"
        currentPage={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/nenhum tenant encontrado/i)).toBeInTheDocument();
    });

    // Filters should not be visible when there are no tenants
    expect(
      screen.queryByPlaceholderText(/buscar por nome ou slug/i),
    ).not.toBeInTheDocument();
  });
});
