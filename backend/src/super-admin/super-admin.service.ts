import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.superAdmin.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { id },
    });

    if (!superAdmin) {
      throw new NotFoundException('Super Admin não encontrado');
    }

    return superAdmin;
  }

  async create(name: string, email: string, password: string) {
    // Verificar se email já existe
    const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    if (existingSuperAdmin) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    return this.prisma.superAdmin.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; email?: string; password?: string },
  ) {
    const superAdmin = await this.findOne(id);

    // Se email está sendo atualizado, verificar se não está em uso
    if (data.email && data.email !== superAdmin.email) {
      const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
        where: { email: data.email },
      });

      if (existingSuperAdmin) {
        throw new ConflictException('Email já está em uso');
      }
    }

    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
    } = { ...data };

    // Hash da senha se fornecida
    if (data.password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(data.password, saltRounds);
      delete (updateData as { password?: string }).password;
    }

    return this.prisma.superAdmin.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.superAdmin.delete({
      where: { id },
    });
  }
}
