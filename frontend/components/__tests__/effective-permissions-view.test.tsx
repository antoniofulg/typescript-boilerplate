import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/src/test-utils';
import userEvent from '@testing-library/user-event';
import { EffectivePermissionsView } from '../effective-permissions-view';

vi.mock('@/lib/authApiService');

let mockApiService: {
  getEffectivePermissions: ReturnType<typeof vi.fn>;
  getPermissions: ReturnType<typeof vi.fn>;
  getUserRoles: ReturnType<typeof vi.fn>;
  getUserPermissionOverrides: ReturnType<typeof vi.fn>;
  getRolePermissions: ReturnType<typeof vi.fn>;
  setToken: ReturnType<typeof vi.fn>;
};

describe('EffectivePermissionsView', () => {
  const mockToken = 'mock-token';
  const mockUserId = 'user-123';

  const mockPermissions = [
    { id: 'p1', key: 'agenda:edit', description: 'Edit agenda' },
    { id: 'p2', key: 'session:view:own', description: 'View own sessions' },
    { id: 'p3', key: 'user:delete', description: 'Delete users' },
  ];

  const mockEffectivePermissions = {
    allowed: ['agenda:edit', 'session:view:own'],
    denied: ['user:delete'],
    details: [
      {
        permissionKey: 'agenda:edit',
        source: 'role' as const,
        roleIds: ['role1'],
      },
      {
        permissionKey: 'user:delete',
        source: 'user' as const,
        grantType: 'DENY' as const,
      },
    ],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const authApiService = await import('@/lib/authApiService');
    const AuthApiServiceMock = vi.mocked(authApiService.AuthApiService);

    mockApiService = {
      getEffectivePermissions: vi.fn(),
      getPermissions: vi.fn(),
      getUserRoles: vi.fn(),
      getUserPermissionOverrides: vi.fn(),
      getRolePermissions: vi.fn(),
      setToken: vi.fn(),
    };

    AuthApiServiceMock.mockImplementation(function () {
      return mockApiService as never;
    });
  });

  it('should render loading state initially', () => {
    vi.mocked(mockApiService.getEffectivePermissions).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<EffectivePermissionsView token={mockToken} userId={mockUserId} />);

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should display effective permissions', async () => {
    vi.mocked(mockApiService.getEffectivePermissions).mockResolvedValue(
      mockEffectivePermissions,
    );
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);

    render(<EffectivePermissionsView token={mockToken} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Permitidas: 2')).toBeInTheDocument();
      expect(screen.getByText('Negadas: 1')).toBeInTheDocument();
    });

    expect(screen.getByText('agenda:edit')).toBeInTheDocument();
    expect(screen.getByText('session:view:own')).toBeInTheDocument();
    expect(screen.getByText('user:delete')).toBeInTheDocument();
  });

  it('should show correct state icons', async () => {
    vi.mocked(mockApiService.getEffectivePermissions).mockResolvedValue(
      mockEffectivePermissions,
    );
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);

    render(<EffectivePermissionsView token={mockToken} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getAllByText('Permitida').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Negada').length).toBeGreaterThan(0);
    });
  });

  it('should filter permissions by search query', async () => {
    vi.mocked(mockApiService.getEffectivePermissions).mockResolvedValue(
      mockEffectivePermissions,
    );
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);

    render(<EffectivePermissionsView token={mockToken} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar permissões...');
    await userEvent.type(searchInput, 'agenda');

    await waitFor(() => {
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
      expect(screen.queryByText('session:view:own')).not.toBeInTheDocument();
    });
  });

  it.skip('should filter permissions by domain', async () => {
    vi.mocked(mockApiService.getEffectivePermissions).mockResolvedValue(
      mockEffectivePermissions,
    );
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);

    render(<EffectivePermissionsView token={mockToken} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
    });

    // Find and click domain filter
    const domainSelect = screen.getByRole('combobox', {
      name: /filtrar por domínio/i,
    });
    await userEvent.click(domainSelect);

    // Select 'agenda' domain
    const agendaOption = screen.getByRole('option', { name: 'agenda' });
    await userEvent.click(agendaOption);

    await waitFor(() => {
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
      expect(screen.queryByText('session:view:own')).not.toBeInTheDocument();
    });
  });

  it('should handle backend endpoint failure and fallback to local aggregation', async () => {
    vi.mocked(mockApiService.getEffectivePermissions).mockRejectedValue(
      new Error('Endpoint not found'),
    );
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);
    vi.mocked(mockApiService.getUserRoles).mockResolvedValue([
      { role: { id: 'role1', name: 'admin' } },
    ]);
    vi.mocked(mockApiService.getUserPermissionOverrides).mockResolvedValue([]);
    vi.mocked(mockApiService.getRolePermissions).mockResolvedValue([
      { id: 'p1', key: 'agenda:edit' },
    ]);

    render(<EffectivePermissionsView token={mockToken} userId={mockUserId} />);

    await waitFor(() => {
      // Should still render permissions using local aggregation
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
    });
  });

  it('should display scope badges for own/any permissions', async () => {
    vi.mocked(mockApiService.getEffectivePermissions).mockResolvedValue(
      mockEffectivePermissions,
    );
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);

    render(<EffectivePermissionsView token={mockToken} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('próprio')).toBeInTheDocument();
    });
  });
});
