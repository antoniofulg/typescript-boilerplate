import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('roles/:roleId/permissions')
@UseGuards(JwtAuthGuard)
export class RolePermissionsController {
  constructor(private prisma: PrismaService) {}

  @Post(':permissionId')
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Check if assignment already exists
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Permission already assigned to role');
    }

    // Create assignment
    await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });

    return { message: 'Permission assigned to role successfully' };
  }

  @Delete(':permissionId')
  async revokePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Check if assignment exists
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Permission assignment not found');
    }

    // Delete assignment
    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    return { message: 'Permission revoked from role successfully' };
  }
}
