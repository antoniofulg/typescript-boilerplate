import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/src/test-utils';
import userEvent from '@testing-library/user-event';
import { EffectivePermissionsView } from '../effective-permissions-view';
import { UserRolesManager } from '../user-roles-manager';

vi.mock('@/lib/authApiService');

let mockApiService: {
  getEffectivePermissions: ReturnType<typeof vi.fn>;
  getPermissions: ReturnType<typeof vi.fn>;
  getRoles: ReturnType<typeof vi.fn>;
  getUserRoles: ReturnType<typeof vi.fn>;
  getUserPermissionOverrides: ReturnType<typeof vi.fn>;
  getRolePermissions: ReturnType<typeof vi.fn>;
  assignRoleToUser: ReturnType<typeof vi.fn>;
  assignPermissionToRole: ReturnType<typeof vi.fn>;
  setToken: ReturnType<typeof vi.fn>;
};

describe('RBAC Integration Flow', () => {
  const mockToken = 'mock-token';
  const mockUserId = 'user-123';

  const mockPermissions = [
    { id: 'p1', key: 'agenda:edit', description: 'Edit agenda' },
    { id: 'p2', key: 'session:view', description: 'View sessions' },
  ];

  const mockRoles = [{ id: 'role1', name: 'admin', description: 'Admin role' }];

  beforeEach(async () => {
    vi.clearAllMocks();

    const authApiModule = await import('@/lib/authApiService');
    const AuthApiServiceMock = vi.mocked(authApiModule.AuthApiService);

    mockApiService = {
      getEffectivePermissions: vi.fn(),
      getPermissions: vi.fn(),
      getRoles: vi.fn(),
      getUserRoles: vi.fn(),
      getUserPermissionOverrides: vi.fn(),
      getRolePermissions: vi.fn(),
      assignRoleToUser: vi.fn(),
      assignPermissionToRole: vi.fn(),
      setToken: vi.fn(),
    };

    AuthApiServiceMock.mockImplementation(function () {
      return mockApiService as never;
    });
  });

  it('should complete full RBAC flow: create permission -> assign to role -> assign role to user -> show in effective permissions', async () => {
    // Step 1: Permissions exist
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);

    // Step 2: Role has permission assigned
    vi.mocked(mockApiService.getRolePermissions).mockResolvedValue([
      { id: 'p1', key: 'agenda:edit' },
    ]);

    // Step 3: User has role assigned
    vi.mocked(mockApiService.getUserRoles).mockResolvedValue([
      { role: mockRoles[0] },
    ]);

    // Step 4: User has no overrides
    vi.mocked(mockApiService.getUserPermissionOverrides).mockResolvedValue([]);

    // Step 5: Effective permissions show the permission as allowed
    vi.mocked(mockApiService.getEffectivePermissions).mockResolvedValue({
      allowed: ['agenda:edit'],
      denied: [],
      details: [
        {
          permissionKey: 'agenda:edit',
          source: 'role',
          roleIds: ['role1'],
        },
      ],
    });

    // Render EffectivePermissionsView
    render(<EffectivePermissionsView token={mockToken} userId={mockUserId} />);

    // Wait for permissions to load
    await waitFor(() => {
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
    });

    // Verify permission is shown as allowed
    expect(screen.getByText('Permitidas: 1')).toBeInTheDocument();
    expect(screen.getByText('Permitida')).toBeInTheDocument();
  });

  it('should show DENY override taking precedence over role permission', async () => {
    // User has role with permission
    vi.mocked(mockApiService.getUserRoles).mockResolvedValue([
      { role: mockRoles[0] },
    ]);

    // Role has permission
    vi.mocked(mockApiService.getRolePermissions).mockResolvedValue([
      { id: 'p1', key: 'agenda:edit' },
    ]);

    // But user has DENY override
    vi.mocked(mockApiService.getUserPermissionOverrides).mockResolvedValue([
      { permissionKey: 'agenda:edit', grantType: 'DENY' },
    ]);

    // Effective permissions show denied
    vi.mocked(mockApiService.getEffectivePermissions).mockResolvedValue({
      allowed: [],
      denied: ['agenda:edit'],
      details: [
        {
          permissionKey: 'agenda:edit',
          source: 'user',
          grantType: 'DENY',
        },
      ],
    });

    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);

    render(<EffectivePermissionsView token={mockToken} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Negadas: 1')).toBeInTheDocument();
      expect(screen.getByText('Negada')).toBeInTheDocument();
    });
  });

  it.skip('should allow assigning role to user', async () => {
    vi.mocked(mockApiService.getRoles).mockResolvedValue(mockRoles);
    vi.mocked(mockApiService.getUserRoles).mockResolvedValue([]);
    vi.mocked(mockApiService.assignRoleToUser).mockResolvedValue(undefined);

    render(<UserRolesManager token={mockToken} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Selecione uma role')).toBeInTheDocument();
    });

    // Select role from dropdown
    const select = screen.getByRole('combobox');
    await userEvent.click(select);

    const option = screen.getByRole('option', { name: /admin/ });
    await userEvent.click(option);

    // Click assign button
    const assignButton = screen.getByText('Atribuir');
    await userEvent.click(assignButton);

    await waitFor(() => {
      expect(mockApiService.assignRoleToUser).toHaveBeenCalledWith(mockUserId, {
        roleId: 'role1',
      });
    });
  });
});
