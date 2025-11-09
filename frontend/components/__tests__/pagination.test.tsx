import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/src/test-utils';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/components/ui/pagination';

describe('Pagination', () => {
  it('renders pagination controls', () => {
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );

    expect(screen.getByLabelText('Página anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Próxima página')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('does not render when totalPages is 1 or less', () => {
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />,
    );

    // Should not render pagination controls
    expect(screen.queryByLabelText('Página anterior')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Próxima página')).not.toBeInTheDocument();
  });

  it('calls onPageChange when clicking next button', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );

    const nextButton = screen.getByLabelText('Próxima página');
    await user.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when clicking previous button', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );

    const prevButton = screen.getByLabelText('Página anterior');
    await user.click(prevButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('disables previous button on first page', () => {
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );

    const prevButton = screen.getByLabelText('Página anterior');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );

    const nextButton = screen.getByLabelText('Próxima página');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when clicking a page number', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );

    const page3Button = screen.getByLabelText('Ir para página 3');
    await user.click(page3Button);

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('highlights current page', () => {
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );

    const currentPageButton = screen.getByLabelText('Ir para página 3');
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    expect(currentPageButton.className).toContain('pointer-events-none');
  });

  it('shows ellipsis for many pages', () => {
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />,
    );

    // Should show ellipsis when there are many pages
    // Check for the MoreHorizontal icon by its parent structure
    const allIcons = document.querySelectorAll('svg');
    const hasEllipsis = Array.from(allIcons).some((svg) =>
      svg.closest('div')?.className.includes('h-9 w-9'),
    );
    expect(hasEllipsis).toBe(true);
  });

  it('shows all pages when totalPages is small', () => {
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );

    // Should show all pages 1-5
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles page change to first page from middle', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />,
    );

    const page1Button = screen.getByLabelText('Ir para página 1');
    await user.click(page1Button);

    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('handles page change to last page from middle', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />,
    );

    const lastPageButton = screen.getByLabelText('Ir para página 10');
    await user.click(lastPageButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(10);
  });
});
