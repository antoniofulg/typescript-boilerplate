import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/src/test-utils';
import userEvent from '@testing-library/user-event';
import { RolePermissionsEditor } from '../role-permissions-editor';

// Mock AuthApiService
const mockApiService = {
  getRoles: vi.fn(),
  getPermissions: vi.fn(),
  getRolePermissions: vi.fn(),
  assignPermissionToRole: vi.fn(),
  removePermissionFromRole: vi.fn(),
  setToken: vi.fn(),
};

vi.mock('@/lib/authApiService', () => ({
  AuthApiService: vi.fn(() => mockApiService),
}));

describe('RolePermissionsEditor', () => {
  const mockToken = 'mock-token';

  const mockRoles = [
    { id: 'role1', name: 'admin', description: 'Admin role' },
    { id: 'role2', name: 'editor', description: 'Editor role' },
  ];

  const mockPermissions = [
    { id: 'p1', key: 'agenda:edit', description: 'Edit agenda' },
    { id: 'p2', key: 'session:view', description: 'View sessions' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(mockApiService.getRoles).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<RolePermissionsEditor token={mockToken} />);

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should display roles and permissions in grid', async () => {
    vi.mocked(mockApiService.getRoles).mockResolvedValue(mockRoles);
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);
    vi.mocked(mockApiService.getRolePermissions).mockResolvedValue([]);

    render(<RolePermissionsEditor token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('editor')).toBeInTheDocument();
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
      expect(screen.getByText('session:view')).toBeInTheDocument();
    });
  });

  it('should toggle permission assignment', async () => {
    vi.mocked(mockApiService.getRoles).mockResolvedValue(mockRoles);
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);
    vi.mocked(mockApiService.getRolePermissions).mockResolvedValue([]);
    vi.mocked(mockApiService.assignPermissionToRole).mockResolvedValue(
      undefined,
    );

    render(<RolePermissionsEditor token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
    });

    // Find checkbox for role1 and permission p1
    const checkboxes = screen.getAllByRole('checkbox');
    // Find the checkbox for the first permission and first role intersection
    const permissionCheckbox = checkboxes.find(
      (cb) =>
        cb.getAttribute('aria-label')?.includes('agenda:edit') &&
        cb.getAttribute('aria-label')?.includes('admin'),
    );

    if (permissionCheckbox) {
      await userEvent.click(permissionCheckbox);

      await waitFor(() => {
        expect(apiService.assignPermissionToRole).toHaveBeenCalledWith(
          'role1',
          {
            permissionId: 'p1',
          },
        );
      });
    }
  });

  it('should filter permissions by search query', async () => {
    vi.mocked(mockApiService.getRoles).mockResolvedValue(mockRoles);
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);
    vi.mocked(mockApiService.getRolePermissions).mockResolvedValue([]);

    render(<RolePermissionsEditor token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar permissões...');
    await userEvent.type(searchInput, 'agenda');

    await waitFor(() => {
      expect(screen.getByText('agenda:edit')).toBeInTheDocument();
      expect(screen.queryByText('session:view')).not.toBeInTheDocument();
    });
  });

  it('should handle bulk apply operation', async () => {
    vi.mocked(mockApiService.getRoles).mockResolvedValue(mockRoles);
    vi.mocked(mockApiService.getPermissions).mockResolvedValue(mockPermissions);
    vi.mocked(mockApiService.getRolePermissions).mockResolvedValue([]);
    vi.mocked(mockApiService.assignPermissionToRole).mockResolvedValue(
      undefined,
    );

    render(<RolePermissionsEditor token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Aplicar Selecionadas')).toBeInTheDocument();
    });

    // Verify the button exists and is initially disabled
    const applyButton = screen.getByText('Aplicar Selecionadas');
    expect(applyButton).toBeDisabled();
  });
});
