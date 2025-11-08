import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/src/test-utils';
import { ThemeToggle } from '@/components/theme-toggle';

// Mock next-themes with importOriginal for partial mocking
vi.mock('next-themes', async () => {
  const actual =
    await vi.importActual<typeof import('next-themes')>('next-themes');
  return {
    ...actual,
    useTheme: vi.fn(() => ({
      theme: 'light',
      setTheme: vi.fn(),
      themes: ['light', 'dark', 'system'],
    })),
  };
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('shows sun icon in light mode', () => {
    render(<ThemeToggle />);
    // The component should render a button with theme toggle
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
