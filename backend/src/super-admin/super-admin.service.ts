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
   * Helper method to exclude passwordHash from SuperAdmin objects
   */
  private excludePasswordHash(superAdmin: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  }): SuperAdminResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = superAdmin;
    return result;
  }

  async findAll(): Promise<SuperAdminResponseDto[]> {
    const superAdmins = await this.prisma.superAdmin.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return superAdmins.map((admin) => this.excludePasswordHash(admin));
  }

  async findOne(id: string): Promise<SuperAdminResponseDto> {
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { id },
    });

    if (!superAdmin) {
      throw new NotFoundException('Super Admin não encontrado');
    }

    return this.excludePasswordHash(superAdmin);
  }

  async update(
    id: string,
    updateSuperAdminDto: UpdateSuperAdminDto,
  ): Promise<SuperAdminResponseDto> {
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { id },
    });

    if (!superAdmin) {
      throw new NotFoundException('Super Admin não encontrado');
    }

    // If email is being updated, check if it's not already in use
    if (
      updateSuperAdminDto.email &&
      updateSuperAdminDto.email !== superAdmin.email
    ) {
      const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
        where: { email: updateSuperAdminDto.email },
      });

      if (existingSuperAdmin) {
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

    const updated = await this.prisma.superAdmin.update({
      where: { id },
      data: updateData,
    });

    return this.excludePasswordHash(updated);
  }

  async remove(id: string): Promise<SuperAdminResponseDto> {
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { id },
    });

    if (!superAdmin) {
      throw new NotFoundException('Super Admin não encontrado');
    }

    const deleted = await this.prisma.superAdmin.delete({
      where: { id },
    });

    return this.excludePasswordHash(deleted);
  }
}
