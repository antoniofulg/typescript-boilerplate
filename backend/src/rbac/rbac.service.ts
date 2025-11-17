import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GrantType } from '@prisma/client';

export interface Resource {
  ownerId?: string;
  [key: string]: unknown;
}

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a user has a specific permission
   * Supports :own and :any suffixes
   * @param userId - User ID to check
   * @param permissionKey - Permission key (e.g., 'users:update' or 'users:update:own')
   * @param resource - Optional resource object with ownerId for :own checks
   * @returns boolean indicating if user has permission
   */
  async hasPermission(
    userId: string,
    permissionKey: string,
    resource?: Resource,
  ): Promise<boolean> {
    // Get user with tenant info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      return false;
    }

    // Parse permission key for suffixes
    const { baseKey, suffix } = this.parsePermissionKey(permissionKey);

    // Get user's effective permissions
    const effective = await this.getUserEffectivePermissions(userId);

    // Check explicit denies first (DENY takes precedence)
    if (
      effective.denied.includes(permissionKey) ||
      effective.denied.includes(baseKey)
    ) {
      return false;
    }

    // Check explicit allows
    if (
      effective.allowed.includes(permissionKey) ||
      effective.allowed.includes(baseKey)
    ) {
      // If :own suffix, check ownership
      if (suffix === 'own') {
        if (!resource?.ownerId) {
          return false;
        }
        return resource.ownerId === userId;
      }
      // :any or no suffix - permission granted
      return true;
    }

    // Check role-based permissions
    const rolePermissions = await this.getRolePermissions(
      userId,
      user.tenantId,
    );

    if (
      rolePermissions.includes(permissionKey) ||
      rolePermissions.includes(baseKey)
    ) {
      // If :own suffix, check ownership
      if (suffix === 'own') {
        if (!resource?.ownerId) {
          return false;
        }
        return resource.ownerId === userId;
      }
      // :any or no suffix - permission granted
      return true;
    }

    return false;
  }

  /**
   * Get user's effective permissions (allowed and denied)
   * @param userId - User ID
   * @returns Object with allowed and denied permission arrays
   */
  async getUserEffectivePermissions(userId: string): Promise<{
    allowed: string[];
    denied: string[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      return { allowed: [], denied: [] };
    }

    // Get role-based permissions
    const rolePermissions = await this.getRolePermissions(
      userId,
      user.tenantId,
    );

    // Get user permission overrides
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId },
      select: { permissionKey: true, grantType: true },
    });

    // Separate allowed and denied
    const allowed: string[] = [...rolePermissions];
    const denied: string[] = [];

    userPermissions.forEach((up) => {
      if (up.grantType === GrantType.ALLOW) {
        if (!allowed.includes(up.permissionKey)) {
          allowed.push(up.permissionKey);
        }
      } else if (up.grantType === GrantType.DENY) {
        // Remove from allowed if present
        const index = allowed.indexOf(up.permissionKey);
        if (index > -1) {
          allowed.splice(index, 1);
        }
        if (!denied.includes(up.permissionKey)) {
          denied.push(up.permissionKey);
        }
      }
    });

    return { allowed, denied };
  }

  /**
   * Get permissions from user's roles (global and tenant-scoped)
   * @param userId - User ID
   * @param tenantId - User's tenant ID
   * @returns Array of permission keys
   */
  private async getRolePermissions(
    userId: string,
    tenantId: string | null,
  ): Promise<string[]> {
    // Get user's role assignments
    const userRoles = await this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissionKeys = new Set<string>();

    userRoles.forEach((userRole) => {
      const role = userRole.role;

      // Include permissions from global roles (tenantId is null)
      // Include permissions from tenant-scoped roles that match user's tenant
      if (role.tenantId === null || role.tenantId === tenantId) {
        role.rolePermissions.forEach((rp) => {
          permissionKeys.add(rp.permission.key);
        });
      }
    });

    return Array.from(permissionKeys);
  }

  /**
   * Parse permission key to extract base key and suffix
   * @param permissionKey - Permission key (e.g., 'users:update:own')
   * @returns Object with baseKey and suffix
   */
  private parsePermissionKey(permissionKey: string): {
    baseKey: string;
    suffix: string | null;
  } {
    const parts = permissionKey.split(':');
    const lastPart = parts[parts.length - 1];

    if (lastPart === 'own' || lastPart === 'any') {
      const suffix = lastPart;
      const baseKey = parts.slice(0, -1).join(':');
      return { baseKey, suffix };
    }

    return { baseKey: permissionKey, suffix: null };
  }
}
