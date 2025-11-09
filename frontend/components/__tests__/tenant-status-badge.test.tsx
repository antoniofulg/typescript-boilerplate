import { describe, it, expect } from 'vitest';
import { render, screen } from '@/src/test-utils';
import { TenantStatusBadge } from '@/components/(superadmin)/tenant-status-badge';

describe('TenantStatusBadge', () => {
  it('renders ACTIVE status badge', () => {
    render(<TenantStatusBadge status="ACTIVE" />);
    expect(screen.getByText(/ativo/i)).toBeInTheDocument();
  });

  it('renders INACTIVE status badge', () => {
    render(<TenantStatusBadge status="INACTIVE" />);
    expect(screen.getByText(/inativo/i)).toBeInTheDocument();
  });

  it('renders SUSPENDED status badge', () => {
    render(<TenantStatusBadge status="SUSPENDED" />);
    expect(screen.getByText(/suspenso/i)).toBeInTheDocument();
  });
});
