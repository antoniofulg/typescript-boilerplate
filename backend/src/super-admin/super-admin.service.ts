import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminResponseDto } from './dto/super-admin-response.dto';
import { UpdateSuperAdminDto } from './dto/update-super-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper method to exclude passwordHash from User objects
   */
  private excludePasswordHash(user: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  }): SuperAdminResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async findAll(): Promise<SuperAdminResponseDto[]> {
    const superUsers = await this.prisma.user.findMany({
      where: {
        role: 'SUPER_USER',
        tenantId: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return superUsers.map((user) => this.excludePasswordHash(user));
  }

  async findOne(id: string): Promise<SuperAdminResponseDto> {
    const superUser = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'SUPER_USER',
        tenantId: null,
      },
    });

    if (!superUser) {
      throw new NotFoundException('Super User não encontrado');
    }

    return this.excludePasswordHash(superUser);
  }

  async update(
    id: string,
    updateSuperAdminDto: UpdateSuperAdminDto,
  ): Promise<SuperAdminResponseDto> {
    const superUser = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'SUPER_USER',
        tenantId: null,
      },
    });

    if (!superUser) {
      throw new NotFoundException('Super User não encontrado');
    }

    // If email is being updated, check if it's not already in use
    if (
      updateSuperAdminDto.email &&
      updateSuperAdminDto.email !== superUser.email
    ) {
      const existingSuperUser = await this.prisma.user.findFirst({
        where: {
          email: updateSuperAdminDto.email,
          role: 'SUPER_USER',
          tenantId: null,
        },
      });

      if (existingSuperUser) {
        throw new ConflictException('Email já está em uso');
      }
    }

    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
    } = { ...updateSuperAdminDto };

    // Hash da senha se fornecida
    if (updateSuperAdminDto.password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(
        updateSuperAdminDto.password,
        saltRounds,
      );
      delete (updateData as { password?: string }).password;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.excludePasswordHash(updated);
  }

  async remove(id: string): Promise<SuperAdminResponseDto> {
    const superUser = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'SUPER_USER',
        tenantId: null,
      },
    });

    if (!superUser) {
      throw new NotFoundException('Super User não encontrado');
    }

    const deleted = await this.prisma.user.delete({
      where: { id },
    });

    return this.excludePasswordHash(deleted);
  }
}
