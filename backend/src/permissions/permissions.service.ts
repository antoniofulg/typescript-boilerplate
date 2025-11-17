import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const { key, name, description } = createPermissionDto;

    // Check if permission key already exists
    const existing = await this.prisma.permission.findUnique({
      where: { key },
    });

    if (existing) {
      throw new ConflictException('Permission key already exists');
    }

    const permission = await this.prisma.permission.create({
      data: {
        key,
        name,
        description,
      },
    });

    return this.mapToResponseDto(permission);
  }

  async findAll(): Promise<PermissionResponseDto[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return permissions.map((p) => this.mapToResponseDto(p));
  }

  async findOne(id: string): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.mapToResponseDto(permission);
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // If key is being updated, check if new key already exists
    if (updatePermissionDto.key && updatePermissionDto.key !== permission.key) {
      const existing = await this.prisma.permission.findUnique({
        where: { key: updatePermissionDto.key },
      });

      if (existing) {
        throw new ConflictException('Permission key already exists');
      }
    }

    const updated = await this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });

    return this.mapToResponseDto(updated);
  }

  async remove(id: string): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const deleted = await this.prisma.permission.delete({
      where: { id },
    });

    return this.mapToResponseDto(deleted);
  }

  private mapToResponseDto(permission: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    createdAt: Date;
  }): PermissionResponseDto {
    return {
      id: permission.id,
      key: permission.key,
      name: permission.name,
      description: permission.description,
      createdAt: permission.createdAt,
    };
  }
}
