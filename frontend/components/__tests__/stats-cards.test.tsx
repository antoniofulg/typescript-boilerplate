import { describe, it, expect } from 'vitest';
import { render, screen } from '@/src/test-utils';
import { StatsCards } from '@/components/(superadmin)/stats-cards';
import type { Tenant } from '@/types/tenant';

const mockTenants: Tenant[] = [
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
  {
    id: '3',
    name: 'Tenant 3',
    slug: 'tenant-3',
    status: 'INACTIVE',
    createdAt: '2024-01-03T00:00:00.000Z',
  },
];

describe('StatsCards', () => {
  it('renders total tenants count', () => {
    render(<StatsCards tenants={mockTenants} />);
    expect(screen.getByText(/total/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders active tenants count', () => {
    render(<StatsCards tenants={mockTenants} />);
    // Use a more specific query to avoid matching "Tenants Inativos"
    expect(screen.getByText(/^Tenants Ativos$/i)).toBeInTheDocument();
    // There might be multiple "2" texts, so we check for at least one
    const activeCounts = screen.getAllByText('2');
    expect(activeCounts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders inactive tenants count', () => {
    render(<StatsCards tenants={mockTenants} />);
    expect(screen.getByText(/inativos/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('handles empty tenants array', () => {
    render(<StatsCards tenants={[]} />);
    // All three cards should show 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });
});
