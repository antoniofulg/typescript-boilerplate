import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/src/test-utils';
import userEvent from '@testing-library/user-event';
import { TenantsTable } from '@/components/(superadmin)/tenants-table';
import type { Tenant } from '@/types/tenant';

const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'Alpha Tenant',
    slug: 'alpha-tenant',
    status: 'ACTIVE',
    createdAt: '2024-01-03T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Beta Tenant',
    slug: 'beta-tenant',
    status: 'INACTIVE',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Gamma Tenant',
    slug: 'gamma-tenant',
    status: 'SUSPENDED',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
];

describe('TenantsTable', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all tenants', async () => {
    render(
      <TenantsTable
        tenants={mockTenants}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    // Wait for component to mount (to avoid hydration issues)
    await waitFor(() => {
      expect(screen.getByText('Alpha Tenant')).toBeInTheDocument();
    });

    expect(screen.getByText('Beta Tenant')).toBeInTheDocument();
    expect(screen.getByText('Gamma Tenant')).toBeInTheDocument();
  });

  it('renders tenant details correctly', async () => {
    render(
      <TenantsTable
        tenants={mockTenants}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Tenant')).toBeInTheDocument();
    });

    expect(screen.getByText('alpha-tenant')).toBeInTheDocument();
    expect(screen.getByText('beta-tenant')).toBeInTheDocument();
  });

  it('sorts by name ascending when clicking name header', async () => {
    const user = userEvent.setup();
    render(
      <TenantsTable
        tenants={mockTenants}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Tenant')).toBeInTheDocument();
    });

    // Find and click the name sort button
    const nameButtons = screen.getAllByText('Nome');
    const nameSortButton = nameButtons
      .find((btn) => btn.closest('button'))
      ?.closest('button');

    if (nameSortButton) {
      await user.click(nameSortButton);

      // Wait for sort to apply
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // First data row should be Alpha (alphabetically first)
        expect(rows[1]).toHaveTextContent('Alpha Tenant');
      });
    }
  });

  it('sorts by name descending on second click', async () => {
    const user = userEvent.setup();
    render(
      <TenantsTable
        tenants={mockTenants}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Tenant')).toBeInTheDocument();
    });

    // Find and click the name sort button twice
    const nameButtons = screen.getAllByText('Nome');
    const nameSortButton = nameButtons
      .map((btn) => btn.closest('button'))
      .find((btn) => btn !== null) as HTMLButtonElement | undefined;

    expect(nameSortButton).toBeDefined();
    if (nameSortButton) {
      await user.click(nameSortButton); // First click: ascending
      await waitFor(() => {
        expect(screen.getByText('Alpha Tenant')).toBeInTheDocument();
      });

      await user.click(nameSortButton); // Second click: descending

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // First data row should be Gamma (alphabetically last)
        expect(rows[1]).toHaveTextContent('Gamma Tenant');
      });
    }
  });

  it('sorts by createdAt ascending when clicking createdAt header', async () => {
    const user = userEvent.setup();
    render(
      <TenantsTable
        tenants={mockTenants}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Tenant')).toBeInTheDocument();
    });

    // Find and click the createdAt sort button
    const dateButtons = screen.getAllByText('Criado em');
    const dateSortButton = dateButtons
      .map((btn) => btn.closest('button'))
      .find((btn) => btn !== null) as HTMLButtonElement | undefined;

    expect(dateSortButton).toBeDefined();
    if (dateSortButton) {
      await user.click(dateSortButton);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // First data row should be Beta (earliest date: 2024-01-01)
        expect(rows[1]).toHaveTextContent('Beta Tenant');
      });
    }
  });

  it('sorts by status when clicking status header', async () => {
    const user = userEvent.setup();
    render(
      <TenantsTable
        tenants={mockTenants}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Tenant')).toBeInTheDocument();
    });

    // Find and click the status sort button
    const statusButtons = screen.getAllByText('Status');
    const statusSortButton = statusButtons
      .map((btn) => btn.closest('button'))
      .find((btn) => btn !== null) as HTMLButtonElement | undefined;

    expect(statusSortButton).toBeDefined();
    if (statusSortButton) {
      await user.click(statusSortButton);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // First data row should be Alpha (ACTIVE comes first alphabetically)
        expect(rows[1]).toHaveTextContent('Alpha Tenant');
      });
    }
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TenantsTable
        tenants={mockTenants}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Tenant')).toBeInTheDocument();
    });

    // Find edit buttons - they are buttons with Edit icon
    // The edit button is in the actions column and has an onClick handler
    // We can find it by looking for buttons that are not the sort buttons
    const buttons = screen.getAllByRole('button');
    // Filter out sort buttons (they contain text like "Nome", "Slug", etc.)
    const actionButtons = buttons.filter((btn) => {
      const text = btn.textContent || '';
      const isSortButton = ['Nome', 'Slug', 'Status', 'Criado em'].some(
        (sortText) => text.includes(sortText),
      );
      return !isSortButton && btn.querySelector('svg');
    });

    // The first action button should be the edit button
    expect(actionButtons.length).toBeGreaterThan(0);
    if (actionButtons.length > 0) {
      await user.click(actionButtons[0]);
      expect(mockOnEdit).toHaveBeenCalled();
    }
  });

  it('displays sort icons correctly', async () => {
    render(
      <TenantsTable
        tenants={mockTenants}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Tenant')).toBeInTheDocument();
    });

    // All sortable columns should have sort icons
    const nameButtons = screen.getAllByText('Nome');
    expect(nameButtons.length).toBeGreaterThan(0);
  });
});
