import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GrantType } from '@prisma/client';
import { AuditLogService } from '../audit-logs/audit-log.service';

@Injectable()
export class AssignmentService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Assign a role to a user
   * Creates audit log in the same transaction
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    grantedBy: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, tenantId: true },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if assignment already exists
    const existing = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Role already assigned to user');
    }

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Create user role assignment
      await tx.userRoleAssignment.create({
        data: {
          userId,
          roleId,
          grantedBy,
        },
      });

      // Create audit log
      await this.auditLogService.createAuditLog(
        {
          userId: grantedBy,
          action: 'ASSIGN_ROLE',
          entity: 'UserRole',
          entityId: userId,
          changes: {
            userId,
            roleId,
            roleName: role.name,
          },
          ipAddress,
          userAgent,
          tenantId: user.tenantId || undefined,
          reason: `Role "${role.name}" assigned to user`,
        },
        tx,
      );
    });
  }

  /**
   * Revoke a role from a user
   * Creates audit log in the same transaction
   */
  async revokeRoleFromUser(
    userId: string,
    roleId: string,
    grantedBy: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if assignment exists
    const existing = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Role assignment not found');
    }

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Delete user role assignment
      await tx.userRoleAssignment.delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });

      // Create audit log
      await this.auditLogService.createAuditLog(
        {
          userId: grantedBy,
          action: 'REVOKE_ROLE',
          entity: 'UserRole',
          entityId: userId,
          changes: {
            userId,
            roleId,
            roleName: role.name,
          },
          ipAddress,
          userAgent,
          tenantId: user.tenantId || undefined,
          reason: `Role "${role.name}" revoked from user`,
        },
        tx,
      );
    });
  }

  /**
   * Grant or deny a permission override to a user
   * Creates audit log in the same transaction
   */
  async grantUserPermission(
    userId: string,
    permissionKey: string,
    grantType: GrantType,
    grantedBy: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate permission key format
    if (!permissionKey || permissionKey.trim().length === 0) {
      throw new BadRequestException('Permission key is required');
    }

    // Check if override already exists
    const existing = await this.prisma.userPermission.findUnique({
      where: {
        userId_permissionKey: {
          userId,
          permissionKey,
        },
      },
    });

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        // Update existing override
        await tx.userPermission.update({
          where: {
            userId_permissionKey: {
              userId,
              permissionKey,
            },
          },
          data: {
            grantType,
            grantedBy,
            reason,
          },
        });
      } else {
        // Create new override
        await tx.userPermission.create({
          data: {
            userId,
            permissionKey,
            grantType,
            grantedBy,
            reason,
          },
        });
      }

      // Create audit log
      await this.auditLogService.createAuditLog(
        {
          userId: grantedBy,
          action: 'GRANT_USER_PERMISSION',
          entity: 'UserPermission',
          entityId: userId,
          changes: {
            userId,
            permissionKey,
            grantType,
            reason,
          },
          ipAddress,
          userAgent,
          tenantId: user.tenantId || undefined,
          reason:
            reason ||
            `Permission "${permissionKey}" ${grantType.toLowerCase()}ed for user`,
        },
        tx,
      );
    });
  }

  /**
   * Revoke a permission override from a user
   * Creates audit log in the same transaction
   */
  async revokeUserPermission(
    userId: string,
    permissionKey: string,
    grantedBy: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if override exists
    const existing = await this.prisma.userPermission.findUnique({
      where: {
        userId_permissionKey: {
          userId,
          permissionKey,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Permission override not found');
    }

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Delete permission override
      await tx.userPermission.delete({
        where: {
          userId_permissionKey: {
            userId,
            permissionKey,
          },
        },
      });

      // Create audit log
      await this.auditLogService.createAuditLog(
        {
          userId: grantedBy,
          action: 'REVOKE_USER_PERMISSION',
          entity: 'UserPermission',
          entityId: userId,
          changes: {
            userId,
            permissionKey,
          },
          ipAddress,
          userAgent,
          tenantId: user.tenantId || undefined,
          reason: `Permission override "${permissionKey}" revoked from user`,
        },
        tx,
      );
    });
  }
}
