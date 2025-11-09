import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const { name, slug } = createTenantDto;

    // Check if slug already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictException('Slug já está em uso');
    }

    return this.prisma.tenant.create({
      data: {
        name,
        slug,
        status: TenantStatus.ACTIVE, // Default status for new tenants
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true,
        sessions: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.findOne(id);

    // If slug is being updated, check if it's not already in use
    if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug: updateTenantDto.slug },
      });

      if (existingTenant) {
        throw new ConflictException('Slug já está em uso');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
