import { RbacService } from './rbac.service';
import { createTestingModule, MockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';
import { GrantType } from '@prisma/client';
import { describe, it, expect, beforeEach } from 'vitest';

describe('RbacService', () => {
  let service: RbacService;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    const { get, mockPrismaService } = await createTestingModule([RbacService]);
    service = get<RbacService>(RbacService);
    prismaService = mockPrismaService;
  });

  describe('hasPermission', () => {
    const userId = faker.string.uuid();
    const tenantId = faker.string.uuid();

    it('should return false for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.hasPermission(userId, 'users:read');

      expect(result).toBe(false);
    });

    it('should return true when user has permission from role', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      const roleId = faker.string.uuid();

      prismaService.userRoleAssignment.findMany.mockResolvedValue([
        {
          userId,
          roleId,
          role: {
            id: roleId,
            tenantId: null, // Global role
            rolePermissions: [
              {
                permission: {
                  key: 'users:read',
                },
              },
            ],
          },
        },
      ]);

      prismaService.userPermission.findMany.mockResolvedValue([]);

      const result = await service.hasPermission(userId, 'users:read');

      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      prismaService.userRoleAssignment.findMany.mockResolvedValue([]);
      prismaService.userPermission.findMany.mockResolvedValue([]);

      const result = await service.hasPermission(userId, 'users:read');

      expect(result).toBe(false);
    });

    it('should return false when permission is denied via user override', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      const roleId = faker.string.uuid();
      prismaService.userRoleAssignment.findMany.mockResolvedValue([
        {
          userId,
          roleId,
          role: {
            id: roleId,
            tenantId: null,
            rolePermissions: [
              {
                permission: {
                  key: 'users:read',
                },
              },
            ],
          },
        },
      ]);

      prismaService.userPermission.findMany.mockResolvedValue([
        {
          permissionKey: 'users:read',
          grantType: GrantType.DENY,
        },
      ]);

      const result = await service.hasPermission(userId, 'users:read');

      expect(result).toBe(false);
    });

    it('should return true for :own suffix when user owns resource', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      const roleId = faker.string.uuid();
      prismaService.userRoleAssignment.findMany.mockResolvedValue([
        {
          userId,
          roleId,
          role: {
            id: roleId,
            tenantId: null,
            rolePermissions: [
              {
                permission: {
                  key: 'users:update',
                },
              },
            ],
          },
        },
      ]);

      prismaService.userPermission.findMany.mockResolvedValue([]);

      const resource = { ownerId: userId };

      const result = await service.hasPermission(
        userId,
        'users:update:own',
        resource,
      );

      expect(result).toBe(true);
    });

    it('should return false for :own suffix when user does not own resource', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      const roleId = faker.string.uuid();
      prismaService.userRoleAssignment.findMany.mockResolvedValue([
        {
          userId,
          roleId,
          role: {
            id: roleId,
            tenantId: null,
            rolePermissions: [
              {
                permission: {
                  key: 'users:update',
                },
              },
            ],
          },
        },
      ]);

      prismaService.userPermission.findMany.mockResolvedValue([]);

      const otherUserId = faker.string.uuid();
      const resource = { ownerId: otherUserId };

      const result = await service.hasPermission(
        userId,
        'users:update:own',
        resource,
      );

      expect(result).toBe(false);
    });

    it('should return true for :any suffix regardless of ownership', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      const roleId = faker.string.uuid();
      prismaService.userRoleAssignment.findMany.mockResolvedValue([
        {
          userId,
          roleId,
          role: {
            id: roleId,
            tenantId: null,
            rolePermissions: [
              {
                permission: {
                  key: 'users:update',
                },
              },
            ],
          },
        },
      ]);

      prismaService.userPermission.findMany.mockResolvedValue([]);

      const otherUserId = faker.string.uuid();
      const resource = { ownerId: otherUserId };

      const result = await service.hasPermission(
        userId,
        'users:update:any',
        resource,
      );

      expect(result).toBe(true);
    });

    it('should respect tenant-scoped roles', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      const globalRoleId = faker.string.uuid();
      const tenantRoleId = faker.string.uuid();
      const otherTenantId = faker.string.uuid();

      prismaService.userRoleAssignment.findMany.mockResolvedValue([
        {
          userId,
          roleId: globalRoleId,
          role: {
            id: globalRoleId,
            tenantId: null, // Global role
            rolePermissions: [
              {
                permission: {
                  key: 'users:read',
                },
              },
            ],
          },
        },
        {
          userId,
          roleId: tenantRoleId,
          role: {
            id: tenantRoleId,
            tenantId, // Tenant-scoped role matching user's tenant
            rolePermissions: [
              {
                permission: {
                  key: 'users:write',
                },
              },
            ],
          },
        },
        {
          userId,
          roleId: faker.string.uuid(),
          role: {
            id: faker.string.uuid(),
            tenantId: otherTenantId, // Different tenant - should be ignored
            rolePermissions: [
              {
                permission: {
                  key: 'users:delete',
                },
              },
            ],
          },
        },
      ]);

      prismaService.userPermission.findMany.mockResolvedValue([]);

      const readResult = await service.hasPermission(userId, 'users:read');
      const writeResult = await service.hasPermission(userId, 'users:write');
      const deleteResult = await service.hasPermission(userId, 'users:delete');

      expect(readResult).toBe(true); // From global role
      expect(writeResult).toBe(true); // From tenant-scoped role
      expect(deleteResult).toBe(false); // From different tenant role
    });
  });

  describe('getUserEffectivePermissions', () => {
    const userId = faker.string.uuid();
    const tenantId = faker.string.uuid();

    it('should return empty arrays for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserEffectivePermissions(userId);

      expect(result).toEqual({ allowed: [], denied: [] });
    });

    it('should aggregate permissions from roles and user overrides', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      const roleId = faker.string.uuid();
      prismaService.userRoleAssignment.findMany.mockResolvedValue([
        {
          userId,
          roleId,
          role: {
            id: roleId,
            tenantId: null,
            rolePermissions: [
              {
                permission: {
                  key: 'users:read',
                },
              },
              {
                permission: {
                  key: 'users:write',
                },
              },
            ],
          },
        },
      ]);

      prismaService.userPermission.findMany.mockResolvedValue([
        {
          permissionKey: 'users:write',
          grantType: GrantType.DENY,
        },
        {
          permissionKey: 'users:delete',
          grantType: GrantType.ALLOW,
        },
      ]);

      const result = await service.getUserEffectivePermissions(userId);

      expect(result.allowed).toContain('users:read');
      expect(result.allowed).toContain('users:delete');
      expect(result.allowed).not.toContain('users:write'); // Denied
      expect(result.denied).toContain('users:write');
    });
  });
});
