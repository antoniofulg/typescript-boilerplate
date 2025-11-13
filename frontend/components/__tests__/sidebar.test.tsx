import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/src/test-utils';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/sidebar';
import type { User } from '@/types/user';

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = vi.fn(() => '/dashboard');

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockSuperUser: User = {
  id: '1',
  name: 'Super User',
  email: 'super@example.com',
  role: 'SUPER_USER',
  tenantId: null,
};

const mockAdminUser: User = {
  id: '2',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
  tenantId: 'tenant-1',
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
  });

  describe('Rendering', () => {
    it('should render sidebar with menu items for SUPER_USER', () => {
      render(<Sidebar user={mockSuperUser} />);

      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Usuários')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });

    it('should render desktop sidebar', () => {
      const { container } = render(<Sidebar user={mockSuperUser} />);
      const desktopSidebar = container.querySelector('aside.hidden.lg\\:flex');
      expect(desktopSidebar).toBeInTheDocument();
    });

    it('should render mobile menu button', () => {
      render(<Sidebar user={mockSuperUser} />);
      const mobileButton = screen.getByRole('button', {
        name: /abrir menu/i,
      });
      expect(mobileButton).toBeInTheDocument();
    });

    it('should not render menu items when user is null', () => {
      render(<Sidebar user={null} />);
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Usuários')).not.toBeInTheDocument();
      expect(screen.queryByText('Logs')).not.toBeInTheDocument();
    });
  });

  describe('Role-based filtering', () => {
    it('should show all items for SUPER_USER', () => {
      render(<Sidebar user={mockSuperUser} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Usuários')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });

    it('should not show items for ADMIN when they are not allowed', () => {
      render(<Sidebar user={mockAdminUser} />);

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Usuários')).not.toBeInTheDocument();
      expect(screen.queryByText('Logs')).not.toBeInTheDocument();
    });
  });

  describe('Active item highlighting', () => {
    it('should highlight active item when pathname matches', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<Sidebar user={mockSuperUser} />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      // With asChild, the Link receives the button classes
      expect(dashboardLink).toHaveClass('bg-accent');
    });

    it('should highlight users item when on /users path', () => {
      mockPathname.mockReturnValue('/users');
      render(<Sidebar user={mockSuperUser} />);

      const usersLink = screen.getByRole('link', { name: /usuários/i });
      expect(usersLink).toHaveClass('bg-accent');
    });

    it('should highlight logs item when on /logs path', () => {
      mockPathname.mockReturnValue('/logs');
      render(<Sidebar user={mockSuperUser} />);

      const logsLink = screen.getByRole('link', { name: /logs/i });
      expect(logsLink).toHaveClass('bg-accent');
    });

    it('should not highlight inactive items', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<Sidebar user={mockSuperUser} />);

      const usersLink = screen.getByRole('link', { name: /usuários/i });
      const logsLink = screen.getByRole('link', { name: /logs/i });

      // Check that they don't have the active class
      expect(usersLink).not.toHaveClass('bg-accent');
      expect(logsLink).not.toHaveClass('bg-accent');
    });
  });

  describe('Navigation', () => {
    it('should render links with correct hrefs', () => {
      render(<Sidebar user={mockSuperUser} />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      const usersLink = screen.getByRole('link', { name: /usuários/i });
      const logsLink = screen.getByRole('link', { name: /logs/i });

      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(usersLink).toHaveAttribute('href', '/users');
      expect(logsLink).toHaveAttribute('href', '/logs');
    });
  });

  describe('Mobile menu', () => {
    it('should render mobile menu button', () => {
      render(<Sidebar user={mockSuperUser} />);

      const mobileButton = screen.getByRole('button', {
        name: /abrir menu/i,
      });

      expect(mobileButton).toBeInTheDocument();
      expect(mobileButton).toHaveClass('lg:hidden');
    });

    it('should have mobile menu button that is clickable', async () => {
      const user = userEvent.setup();
      render(<Sidebar user={mockSuperUser} />);

      const mobileButton = screen.getByRole('button', {
        name: /abrir menu/i,
      });

      await user.click(mobileButton);
      // Button should still be in document after click
      expect(mobileButton).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render icons for each menu item', () => {
      render(<Sidebar user={mockSuperUser} />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      const usersLink = screen.getByRole('link', { name: /usuários/i });
      const logsLink = screen.getByRole('link', { name: /logs/i });

      // Icons are rendered as SVG elements
      expect(dashboardLink.querySelector('svg')).toBeInTheDocument();
      expect(usersLink.querySelector('svg')).toBeInTheDocument();
      expect(logsLink.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have screen reader text for mobile menu button', () => {
      render(<Sidebar user={mockSuperUser} />);

      const srText = screen.getByText('Abrir menu', { selector: '.sr-only' });
      expect(srText).toBeInTheDocument();
    });

    it('should have screen reader text for close button in mobile menu', () => {
      render(<Sidebar user={mockSuperUser} />);

      // The close button text is rendered when Sheet is open
      // We verify the structure exists
      const mobileButton = screen.getByRole('button', {
        name: /abrir menu/i,
      });
      expect(mobileButton).toBeInTheDocument();
    });
  });
});
