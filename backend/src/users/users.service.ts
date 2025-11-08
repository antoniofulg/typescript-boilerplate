import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentUserTenantId?: string) {
    const { name, email, password, role, tenantId } = createUserDto;

    // Se o usuário atual tem tenantId, só pode criar usuários no mesmo tenant
    const targetTenantId = currentUserTenantId || tenantId;

    if (currentUserTenantId && tenantId && tenantId !== currentUserTenantId) {
      throw new ForbiddenException(
        'Você não tem permissão para criar usuários em outro tenant',
      );
    }

    // Verificar se email já existe
    if (targetTenantId) {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: targetTenantId,
            email,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso neste tenant');
      }
    } else {
      const existingUser = await this.prisma.user.findFirst({
        where: { email, tenantId: null },
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Validar tenant se fornecido
    if (targetTenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: targetTenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado');
      }

      if (tenant.status !== 'ACTIVE') {
        throw new ForbiddenException('Tenant inativo');
      }
    }

    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    return this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        tenantId: targetTenantId || null,
      },
      include: {
        tenant: true,
      },
    });
  }

  async findAll(currentUserTenantId?: string) {
    if (currentUserTenantId) {
      return this.prisma.user.findMany({
        where: { tenantId: currentUserTenantId },
        include: { tenant: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.user.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUserTenantId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário pertence ao mesmo tenant
    if (
      currentUserTenantId &&
      user.tenantId &&
      user.tenantId !== currentUserTenantId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este usuário',
      );
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserTenantId?: string,
  ) {
    const user = await this.findOne(id, currentUserTenantId);

    // Verificar se o usuário pertence ao mesmo tenant
    if (
      currentUserTenantId &&
      user.tenantId &&
      user.tenantId !== currentUserTenantId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este usuário',
      );
    }

    // Se email está sendo atualizado, verificar se não está em uso
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          tenantId: user.tenantId,
        },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Hash da senha se fornecida
    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
      role?: import('@prisma/client').UserRole;
    } = { ...updateUserDto };
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
      delete (updateData as { password?: string }).password;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { tenant: true },
    });
  }

  async remove(id: string, currentUserTenantId?: string) {
    const user = await this.findOne(id, currentUserTenantId);

    // Verificar se o usuário pertence ao mesmo tenant
    if (
      currentUserTenantId &&
      user.tenantId &&
      user.tenantId !== currentUserTenantId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para remover este usuário',
      );
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
