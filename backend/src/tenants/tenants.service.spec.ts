import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { createMockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';

describe('TenantsService', () => {
  let service: TenantsService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTenantDto: CreateTenantDto = {
      name: 'Test Tenant',
      slug: 'test-tenant',
    };

    it('should create a tenant successfully', async () => {
      const mockTenant = {
        id: faker.string.uuid(),
        ...createTenantDto,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      prismaService.tenant.findUnique.mockResolvedValue(null);
      prismaService.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.create(createTenantDto);

      expect(result).toEqual(mockTenant);
      expect(prismaService.tenant.create).toHaveBeenCalledWith({
        data: createTenantDto,
      });
    });

    it('should throw ConflictException for existing slug', async () => {
      const existingTenant = {
        id: faker.string.uuid(),
        ...createTenantDto,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      prismaService.tenant.findUnique.mockResolvedValue(existingTenant);

      await expect(service.create(createTenantDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      const mockTenants = [
        {
          id: faker.string.uuid(),
          name: 'Tenant 1',
          slug: 'tenant-1',
          status: 'ACTIVE' as const,
          createdAt: new Date(),
        },
        {
          id: faker.string.uuid(),
          name: 'Tenant 2',
          slug: 'tenant-2',
          status: 'ACTIVE' as const,
          createdAt: new Date(),
        },
      ];

      prismaService.tenant.findMany.mockResolvedValue(mockTenants);

      const result = await service.findAll();

      expect(result).toEqual(mockTenants);
      expect(prismaService.tenant.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a tenant by id', async () => {
      const tenantId = faker.string.uuid();
      const mockTenant = {
        id: tenantId,
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        users: [],
        sessions: [],
      };

      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findOne(tenantId);

      expect(result).toEqual(mockTenant);
    });

    it('should throw NotFoundException for non-existent tenant', async () => {
      const tenantId = faker.string.uuid();

      prismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne(tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a tenant successfully', async () => {
      const tenantId = faker.string.uuid();
      const updateTenantDto: UpdateTenantDto = {
        name: 'Updated Tenant Name',
      };

      const existingTenant = {
        id: tenantId,
        name: 'Original Name',
        slug: 'original-slug',
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        users: [],
        sessions: [],
      };

      const updatedTenant = {
        ...existingTenant,
        ...updateTenantDto,
      };

      prismaService.tenant.findUnique
        .mockResolvedValueOnce(existingTenant)
        .mockResolvedValueOnce(existingTenant);
      prismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.update(tenantId, updateTenantDto);

      expect(result).toEqual(updatedTenant);
      expect(prismaService.tenant.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a tenant successfully', async () => {
      const tenantId = faker.string.uuid();
      const mockTenant = {
        id: tenantId,
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        users: [],
        sessions: [],
      };

      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.tenant.delete.mockResolvedValue(mockTenant);

      const result = await service.remove(tenantId);

      expect(result).toEqual(mockTenant);
      expect(prismaService.tenant.delete).toHaveBeenCalledWith({
        where: { id: tenantId },
      });
    });
  });
});
