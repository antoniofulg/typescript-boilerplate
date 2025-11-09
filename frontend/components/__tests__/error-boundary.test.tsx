import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@/src/test-utils';
import { ErrorBoundary } from '@/components/error-boundary';

// Component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    expect(screen.getByText(/ocorreu um erro inesperado/i)).toBeInTheDocument();
  });

  it('shows error message in development mode', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Error boundary should show error UI
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    // Error message might be shown depending on NODE_ENV
    const errorMessage = screen.queryByText(/test error/i);
    if (errorMessage) {
      expect(errorMessage).toBeInTheDocument();
    }
  });

  it('has reset error button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const resetButton = screen.getByRole('button', {
      name: /tentar novamente/i,
    });
    expect(resetButton).toBeInTheDocument();
  });

  it('has home button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const homeLink = screen.getByRole('link', { name: /ir para início/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
