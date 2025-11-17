import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const { name, slug, description, tenantId } = createRoleDto;

    // Check if role slug already exists
    const existing = await this.prisma.role.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Role slug already exists');
    }

    // If tenantId is provided, verify tenant exists
    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
    }

    const role = await this.prisma.role.create({
      data: {
        name,
        slug,
        description,
        tenantId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return this.mapToResponseDto(role);
  }

  async findAll(tenantId?: string): Promise<RoleResponseDto[]> {
    const where: { tenantId?: string | null } = {};

    if (tenantId !== undefined) {
      where.tenantId = tenantId || null;
    }

    const roles = await this.prisma.role.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return roles.map((r) => this.mapToResponseDto(r));
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.mapToResponseDto(role);
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // If slug is being updated, check if new slug already exists
    if (updateRoleDto.slug && updateRoleDto.slug !== role.slug) {
      const existing = await this.prisma.role.findUnique({
        where: { slug: updateRoleDto.slug },
      });

      if (existing) {
        throw new ConflictException('Role slug already exists');
      }
    }

    // If tenantId is being updated, verify tenant exists
    if (updateRoleDto.tenantId !== undefined) {
      if (updateRoleDto.tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: updateRoleDto.tenantId },
        });

        if (!tenant) {
          throw new NotFoundException('Tenant not found');
        }
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updated);
  }

  async remove(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const deleted = await this.prisma.role.delete({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return this.mapToResponseDto(deleted);
  }

  private mapToResponseDto(role: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    tenantId: string | null;
    createdAt: Date;
    tenant?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      tenantId: role.tenantId,
      tenant: role.tenant || null,
      createdAt: role.createdAt,
    };
  }
}
