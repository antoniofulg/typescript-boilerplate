import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole, TenantStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper method to exclude passwordHash from User objects
   */
  private excludePasswordHash(user: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    tenantId: string | null;
    tenant?: {
      id: string;
      name: string;
      slug: string;
      status: string;
    } | null;
    createdAt: Date;
  }): UserResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * Verify super user password for operations on SUPER_USER
   */
  async verifySuperUserPassword(
    superUserId: string,
    password: string,
  ): Promise<boolean> {
    const superUser = await this.prisma.user.findUnique({
      where: { id: superUserId },
    });

    if (!superUser || superUser.role !== UserRole.SUPER_USER) {
      throw new ForbiddenException('Usuário não é um Super User');
    }

    return bcrypt.compare(password, superUser.passwordHash);
  }

  async create(
    createUserDto: CreateUserDto,
    currentSuperUserId: string,
  ): Promise<UserResponseDto> {
    const { name, email, password, role, tenantId, passwordConfirmation } =
      createUserDto;

    // If creating SUPER_USER, require password confirmation
    if (role === UserRole.SUPER_USER) {
      if (!passwordConfirmation) {
        throw new BadRequestException(
          'Confirmação de senha é obrigatória para criar SUPER_USER',
        );
      }

      const isValid = await this.verifySuperUserPassword(
        currentSuperUserId,
        passwordConfirmation,
      );

      if (!isValid) {
        throw new ForbiddenException('Senha de confirmação inválida');
      }
    }

    // SUPER_USER cannot have tenantId
    const finalTenantId =
      role === UserRole.SUPER_USER ? null : tenantId || null;

    // Check if email already exists
    if (finalTenantId) {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: finalTenantId,
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

    // Validate tenant if provided
    if (finalTenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: finalTenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado');
      }

      if (tenant.status !== TenantStatus.ACTIVE) {
        throw new ForbiddenException('Tenant inativo');
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        tenantId: finalTenantId,
      },
      include: {
        tenant: true,
      },
    });

    return this.excludePasswordHash(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.excludePasswordHash(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.excludePasswordHash(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentSuperUserId: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isTargetSuperUser = user.role === UserRole.SUPER_USER;
    const isChangingToSuperUser =
      updateUserDto.role === UserRole.SUPER_USER &&
      user.role !== UserRole.SUPER_USER;
    const isChangingFromSuperUser =
      user.role === UserRole.SUPER_USER &&
      updateUserDto.role &&
      updateUserDto.role !== UserRole.SUPER_USER;

    // If target is SUPER_USER or changing to SUPER_USER, require password confirmation
    if (isTargetSuperUser || isChangingToSuperUser) {
      if (!updateUserDto.passwordConfirmation) {
        throw new BadRequestException(
          'Confirmação de senha é obrigatória para operações em SUPER_USER',
        );
      }

      const isValid = await this.verifySuperUserPassword(
        currentSuperUserId,
        updateUserDto.passwordConfirmation,
      );

      if (!isValid) {
        throw new ForbiddenException('Senha de confirmação inválida');
      }
    }

    // If email is being updated, check if it's not already in use
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

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
      role?: UserRole;
      tenantId?: string | null;
    } = { ...updateUserDto };

    // Hash password if provided
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    // Remove passwordConfirmation from update data
    delete (updateData as { passwordConfirmation?: string })
      .passwordConfirmation;

    // If changing to SUPER_USER, set tenantId to null
    if (isChangingToSuperUser) {
      updateData.tenantId = null;
    }

    // If changing from SUPER_USER, allow setting tenantId
    if (isChangingFromSuperUser && updateUserDto.tenantId) {
      // Validate tenant
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: updateUserDto.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado');
      }

      if (tenant.status !== TenantStatus.ACTIVE) {
        throw new ForbiddenException('Tenant inativo');
      }

      updateData.tenantId = updateUserDto.tenantId;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { tenant: true },
    });

    return this.excludePasswordHash(updated);
  }

  async remove(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Password confirmation for SUPER_USER is handled in the controller

    const deleted = await this.prisma.user.delete({
      where: { id },
      include: { tenant: true },
    });

    return this.excludePasswordHash(deleted);
  }

  async verifyPasswordForSuperUserOperation(
    superUserId: string,
    password: string,
  ): Promise<void> {
    const isValid = await this.verifySuperUserPassword(superUserId, password);

    if (!isValid) {
      throw new ForbiddenException('Senha de confirmação inválida');
    }
  }
}
