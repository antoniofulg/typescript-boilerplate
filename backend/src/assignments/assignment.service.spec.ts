import { NotFoundException, ConflictException } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { createTestingModule, MockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';
import { GrantType } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let prismaService: MockPrismaService;
  let auditLogService: AuditLogService;

  beforeEach(async () => {
    const { get, mockPrismaService } = await createTestingModule([
      AssignmentService,
      AuditLogService,
    ]);
    service = get<AssignmentService>(AssignmentService);
    auditLogService = get<AuditLogService>(AuditLogService);
    prismaService = mockPrismaService;
  });

  describe('assignRoleToUser', () => {
    const userId = faker.string.uuid();
    const roleId = faker.string.uuid();
    const grantedBy = faker.string.uuid();
    const tenantId = faker.string.uuid();

    it('should assign role to user and create audit log', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      prismaService.role.findUnique.mockResolvedValue({
        id: roleId,
        name: 'Test Role',
        tenantId: null,
      });

      prismaService.userRoleAssignment.findUnique.mockResolvedValue(null);
      prismaService.userRoleAssignment.create.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        roleId,
        grantedBy,
        grantedAt: new Date(),
      });

      prismaService.$transaction.mockImplementation(
        async (callback: (tx: MockPrismaService) => Promise<unknown>) => {
          const tx = prismaService;
          return callback(tx);
        },
      );

      vi.spyOn(auditLogService, 'createAuditLog').mockResolvedValue();

      await service.assignRoleToUser(userId, roleId, grantedBy);

      expect(prismaService.userRoleAssignment.create).toHaveBeenCalled();
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignRoleToUser(userId, roleId, grantedBy),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });
      prismaService.role.findUnique.mockResolvedValue(null);

      await expect(
        service.assignRoleToUser(userId, roleId, grantedBy),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if role already assigned', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      prismaService.role.findUnique.mockResolvedValue({
        id: roleId,
        name: 'Test Role',
        tenantId: null,
      });

      prismaService.userRoleAssignment.findUnique.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        roleId,
        grantedBy,
        grantedAt: new Date(),
      });

      await expect(
        service.assignRoleToUser(userId, roleId, grantedBy),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('revokeRoleFromUser', () => {
    const userId = faker.string.uuid();
    const roleId = faker.string.uuid();
    const grantedBy = faker.string.uuid();
    const tenantId = faker.string.uuid();

    it('should revoke role from user and create audit log', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      prismaService.role.findUnique.mockResolvedValue({
        id: roleId,
        name: 'Test Role',
      });

      prismaService.userRoleAssignment.findUnique.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        roleId,
        grantedBy,
        grantedAt: new Date(),
      });

      prismaService.userRoleAssignment.delete.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        roleId,
        grantedBy,
        grantedAt: new Date(),
      });

      prismaService.$transaction.mockImplementation(
        async (callback: (tx: MockPrismaService) => Promise<unknown>) => {
          const tx = prismaService;
          return callback(tx);
        },
      );

      vi.spyOn(auditLogService, 'createAuditLog').mockResolvedValue();

      await service.revokeRoleFromUser(userId, roleId, grantedBy);

      expect(prismaService.userRoleAssignment.delete).toHaveBeenCalled();
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
    });

    it('should throw NotFoundException if assignment does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      prismaService.role.findUnique.mockResolvedValue({
        id: roleId,
        name: 'Test Role',
      });

      prismaService.userRoleAssignment.findUnique.mockResolvedValue(null);

      await expect(
        service.revokeRoleFromUser(userId, roleId, grantedBy),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('grantUserPermission', () => {
    const userId = faker.string.uuid();
    const permissionKey = 'users:delete';
    const grantedBy = faker.string.uuid();
    const tenantId = faker.string.uuid();

    it('should grant permission override and create audit log', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      prismaService.userPermission.findUnique.mockResolvedValue(null);
      prismaService.userPermission.create.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        permissionKey,
        grantType: GrantType.ALLOW,
        grantedBy,
        grantedAt: new Date(),
        reason: null,
      });

      prismaService.$transaction.mockImplementation(
        async (callback: (tx: MockPrismaService) => Promise<unknown>) => {
          const tx = prismaService;
          return callback(tx);
        },
      );

      vi.spyOn(auditLogService, 'createAuditLog').mockResolvedValue();

      await service.grantUserPermission(
        userId,
        permissionKey,
        GrantType.ALLOW,
        grantedBy,
        'Test reason',
      );

      expect(prismaService.userPermission.create).toHaveBeenCalled();
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
    });

    it('should update existing permission override', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      prismaService.userPermission.findUnique.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        permissionKey,
        grantType: GrantType.DENY,
        grantedBy,
        grantedAt: new Date(),
        reason: null,
      });

      prismaService.userPermission.update.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        permissionKey,
        grantType: GrantType.ALLOW,
        grantedBy,
        grantedAt: new Date(),
        reason: 'Updated reason',
      });

      prismaService.$transaction.mockImplementation(
        async (callback: (tx: MockPrismaService) => Promise<unknown>) => {
          const tx = prismaService;
          return callback(tx);
        },
      );

      vi.spyOn(auditLogService, 'createAuditLog').mockResolvedValue();

      await service.grantUserPermission(
        userId,
        permissionKey,
        GrantType.ALLOW,
        grantedBy,
        'Updated reason',
      );

      expect(prismaService.userPermission.update).toHaveBeenCalled();
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
    });
  });

  describe('revokeUserPermission', () => {
    const userId = faker.string.uuid();
    const permissionKey = 'users:delete';
    const grantedBy = faker.string.uuid();
    const tenantId = faker.string.uuid();

    it('should revoke permission override and create audit log', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      prismaService.userPermission.findUnique.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        permissionKey,
        grantType: GrantType.ALLOW,
        grantedBy,
        grantedAt: new Date(),
        reason: null,
      });

      prismaService.userPermission.delete.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        permissionKey,
        grantType: GrantType.ALLOW,
        grantedBy,
        grantedAt: new Date(),
        reason: null,
      });

      prismaService.$transaction.mockImplementation(
        async (callback: (tx: MockPrismaService) => Promise<unknown>) => {
          const tx = prismaService;
          return callback(tx);
        },
      );

      vi.spyOn(auditLogService, 'createAuditLog').mockResolvedValue();

      await service.revokeUserPermission(userId, permissionKey, grantedBy);

      expect(prismaService.userPermission.delete).toHaveBeenCalled();
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
    });

    it('should throw NotFoundException if override does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId,
      });

      prismaService.userPermission.findUnique.mockResolvedValue(null);

      await expect(
        service.revokeUserPermission(userId, permissionKey, grantedBy),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
