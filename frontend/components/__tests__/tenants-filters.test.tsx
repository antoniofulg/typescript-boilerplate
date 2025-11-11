import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/src/test-utils';
import userEvent from '@testing-library/user-event';
import { TenantsFilters } from '@/components/(superadmin)/tenants-filters';

describe('TenantsFilters', () => {
  const mockOnSearchChange = vi.fn();
  const mockOnStatusFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and status filter', () => {
    render(
      <TenantsFilters
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        statusFilter="ALL"
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    expect(
      screen.getByPlaceholderText(/buscar por nome ou slug/i),
    ).toBeInTheDocument();
    // The select should be present (as combobox)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays current search query', () => {
    render(
      <TenantsFilters
        searchQuery="test query"
        onSearchChange={mockOnSearchChange}
        statusFilter="ALL"
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    const input = screen.getByPlaceholderText(/buscar por nome ou slug/i);
    expect(input).toHaveValue('test query');
  });

  it('calls onSearchChange when typing in search input', async () => {
    const user = userEvent.setup();
    render(
      <TenantsFilters
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        statusFilter="ALL"
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    const input = screen.getByPlaceholderText(/buscar por nome ou slug/i);
    // Type a single character to verify the callback is called
    await user.type(input, 't');

    // Should be called when typing
    expect(mockOnSearchChange).toHaveBeenCalled();
    // Verify it was called with at least the character we typed
    const calls = mockOnSearchChange.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    // The last call should contain the character we typed
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toContain('t');
  });

  it('shows clear button when search query is not empty', () => {
    render(
      <TenantsFilters
        searchQuery="test"
        onSearchChange={mockOnSearchChange}
        statusFilter="ALL"
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    // The clear button should be present (it's a button with X icon)
    // We check by looking for buttons with absolute positioning
    const buttons = screen.getAllByRole('button');
    const hasClearButton = buttons.some((btn) => {
      const className = btn.className || '';
      return className.includes('absolute') && className.includes('right-1');
    });
    expect(hasClearButton).toBe(true);
  });

  it('does not show clear button when search query is empty', () => {
    render(
      <TenantsFilters
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        statusFilter="ALL"
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    // The clear button should not be in the document when query is empty
    // We check by looking for buttons with absolute positioning and right-1 class
    const buttons = screen.queryAllByRole('button');
    const clearButton = buttons.find((btn) => {
      const className = btn.className || '';
      return (
        className.includes('absolute') &&
        className.includes('right-1') &&
        btn.querySelector('svg')
      );
    });
    // The clear button should not exist when query is empty
    expect(clearButton).toBeUndefined();
  });

  it('calls onSearchChange with empty string when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TenantsFilters
        searchQuery="test"
        onSearchChange={mockOnSearchChange}
        statusFilter="ALL"
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    // Find the clear button (button with X icon in absolute position)
    const buttons = screen.getAllByRole('button');
    const clearButton = buttons.find((btn) => {
      const svg = btn.querySelector('svg');
      return (
        svg &&
        btn.className.includes('absolute') &&
        btn.className.includes('right-1')
      );
    });

    expect(clearButton).toBeDefined();
    if (clearButton) {
      await user.click(clearButton);
      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    }
  });

  it('displays status filter select', () => {
    render(
      <TenantsFilters
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        statusFilter="ACTIVE"
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    // The select should be present
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeInTheDocument();
  });

  it('has status filter select component', () => {
    render(
      <TenantsFilters
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        statusFilter="ALL"
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    // The select should be present
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeInTheDocument();
  });
});
