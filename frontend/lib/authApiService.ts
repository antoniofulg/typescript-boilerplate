import { ApiClient } from './api';

// Types
export type Permission = {
  id: string;
  key: string;
  description?: string;
};

export type Role = {
  id: string;
  name: string;
  description?: string;
  tenant_id?: string | null;
};

export type UserRole = {
  role: Role;
};

export type UserPermissionOverride = {
  permissionKey: string;
  grantType: 'ALLOW' | 'DENY';
};

export type EffectivePermissionDetail = {
  permissionKey: string;
  source: 'role' | 'user';
  roleIds?: string[];
  grantType?: 'ALLOW' | 'DENY';
};

export type EffectivePermissions = {
  allowed: string[];
  denied: string[];
  details: EffectivePermissionDetail[];
};

// DTOs
export type CreatePermissionDto = {
  key: string;
  description?: string;
};

export type UpdatePermissionDto = {
  key?: string;
  description?: string;
};

export type CreateRoleDto = {
  name: string;
  description?: string;
  tenant_id?: string;
};

export type UpdateRoleDto = {
  name?: string;
  description?: string;
  tenant_id?: string;
};

export type AssignPermissionToRoleDto = {
  permissionId: string;
};

export type AssignRoleToUserDto = {
  roleId: string;
};

export type CreateUserPermissionOverrideDto = {
  permissionKey: string;
  grantType: 'ALLOW' | 'DENY';
};

/**
 * Service for RBAC API operations
 */
export class AuthApiService {
  private client: ApiClient;

  constructor(token: string | null) {
    this.client = new ApiClient(token);
  }

  setToken(token: string | null) {
    this.client.setToken(token);
  }

  // Permissions
  async getPermissions(): Promise<Permission[]> {
    return this.client.get<Permission[]>('/permissions');
  }

  async getPermission(id: string): Promise<Permission> {
    return this.client.get<Permission>(`/permissions/${id}`);
  }

  async createPermission(data: CreatePermissionDto): Promise<Permission> {
    return this.client.post<Permission>('/permissions', data);
  }

  async updatePermission(
    id: string,
    data: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.client.patch<Permission>(`/permissions/${id}`, data);
  }

  async deletePermission(id: string): Promise<void> {
    return this.client.delete<void>(`/permissions/${id}`);
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    return this.client.get<Role[]>('/roles');
  }

  async getRole(id: string): Promise<Role> {
    return this.client.get<Role>(`/roles/${id}`);
  }

  async createRole(data: CreateRoleDto): Promise<Role> {
    return this.client.post<Role>('/roles', data);
  }

  async updateRole(id: string, data: UpdateRoleDto): Promise<Role> {
    return this.client.patch<Role>(`/roles/${id}`, data);
  }

  async deleteRole(id: string): Promise<void> {
    return this.client.delete<void>(`/roles/${id}`);
  }

  // Role Permissions
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    return this.client.get<Permission[]>(`/roles/${roleId}/permissions`);
  }

  async assignPermissionToRole(
    roleId: string,
    data: AssignPermissionToRoleDto,
  ): Promise<void> {
    return this.client.post<void>(`/roles/${roleId}/permissions`, data);
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    return this.client.delete<void>(
      `/roles/${roleId}/permissions/${permissionId}`,
    );
  }

  // Bulk role-permission operations
  async bulkAssignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    // If backend supports bulk, use it; otherwise make parallel requests
    const promises = permissionIds.map((permissionId) =>
      this.assignPermissionToRole(roleId, { permissionId }),
    );
    await Promise.all(promises);
  }

  async bulkRemovePermissionsFromRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const promises = permissionIds.map((permissionId) =>
      this.removePermissionFromRole(roleId, permissionId),
    );
    await Promise.all(promises);
  }

  // User Roles
  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.client.get<UserRole[]>(`/users/${userId}/roles`);
  }

  async assignRoleToUser(
    userId: string,
    data: AssignRoleToUserDto,
  ): Promise<void> {
    return this.client.post<void>(`/users/${userId}/roles`, data);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    return this.client.delete<void>(`/users/${userId}/roles/${roleId}`);
  }

  // User Permission Overrides
  async getUserPermissionOverrides(
    userId: string,
  ): Promise<UserPermissionOverride[]> {
    return this.client.get<UserPermissionOverride[]>(
      `/users/${userId}/permissions/overrides`,
    );
  }

  async createUserPermissionOverride(
    userId: string,
    data: CreateUserPermissionOverrideDto,
  ): Promise<UserPermissionOverride> {
    return this.client.post<UserPermissionOverride>(
      `/users/${userId}/permissions/overrides`,
      data,
    );
  }

  async deleteUserPermissionOverride(
    userId: string,
    permissionKey: string,
  ): Promise<void> {
    return this.client.delete<void>(
      `/users/${userId}/permissions/overrides/${permissionKey}`,
    );
  }

  // Effective Permissions
  async getEffectivePermissions(userId: string): Promise<EffectivePermissions> {
    try {
      return await this.client.get<EffectivePermissions>(
        `/users/${userId}/effective-permissions`,
      );
    } catch (error) {
      // If endpoint doesn't exist, fallback to local aggregation
      // This will be handled by the component using this service
      throw error;
    }
  }
}
