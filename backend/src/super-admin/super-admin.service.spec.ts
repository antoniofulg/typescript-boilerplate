import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<SuperAdminService>(SuperAdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all super admins', async () => {
      const mockSuperAdmins = [
        {
          id: faker.string.uuid(),
          name: 'Admin 1',
          email: 'admin1@example.com',
          passwordHash: 'hashed',
          createdAt: new Date(),
        },
        {
          id: faker.string.uuid(),
          name: 'Admin 2',
          email: 'admin2@example.com',
          passwordHash: 'hashed',
          createdAt: new Date(),
        },
      ];

      prismaService.superAdmin.findMany.mockResolvedValue(mockSuperAdmins);

      const result = await service.findAll();

      expect(result).toEqual(mockSuperAdmins);
      expect(prismaService.superAdmin.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a super admin by id', async () => {
      const adminId = faker.string.uuid();
      const mockSuperAdmin = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
      };

      prismaService.superAdmin.findUnique.mockResolvedValue(mockSuperAdmin);

      const result = await service.findOne(adminId);

      expect(result).toEqual(mockSuperAdmin);
    });

    it('should throw NotFoundException for non-existent super admin', async () => {
      const adminId = faker.string.uuid();

      prismaService.superAdmin.findUnique.mockResolvedValue(null);

      await expect(service.findOne(adminId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a super admin successfully', async () => {
      const name = 'New Admin';
      const email = 'newadmin@example.com';
      const password = 'password123';

      const mockSuperAdmin = {
        id: faker.string.uuid(),
        name,
        email,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      prismaService.superAdmin.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prismaService.superAdmin.create.mockResolvedValue(mockSuperAdmin);

      const result = await service.create(name, email, password);

      expect(result).toEqual(mockSuperAdmin);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(prismaService.superAdmin.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for existing email', async () => {
      const name = 'New Admin';
      const email = 'existing@example.com';
      const password = 'password123';

      const existingAdmin = {
        id: faker.string.uuid(),
        name: 'Existing Admin',
        email,
        passwordHash: 'hashed',
        createdAt: new Date(),
      };

      prismaService.superAdmin.findUnique.mockResolvedValue(existingAdmin);

      await expect(service.create(name, email, password)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a super admin successfully', async () => {
      const adminId = faker.string.uuid();
      const updateData = {
        name: 'Updated Name',
      };

      const existingAdmin = {
        id: adminId,
        name: 'Original Name',
        email: 'admin@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
      };

      const updatedAdmin = {
        ...existingAdmin,
        ...updateData,
      };

      prismaService.superAdmin.findUnique
        .mockResolvedValueOnce(existingAdmin)
        .mockResolvedValueOnce(existingAdmin);
      prismaService.superAdmin.update.mockResolvedValue(updatedAdmin);

      const result = await service.update(adminId, updateData);

      expect(result).toEqual(updatedAdmin);
      expect(prismaService.superAdmin.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a super admin successfully', async () => {
      const adminId = faker.string.uuid();
      const mockSuperAdmin = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
      };

      prismaService.superAdmin.findUnique.mockResolvedValue(mockSuperAdmin);
      prismaService.superAdmin.delete.mockResolvedValue(mockSuperAdmin);

      const result = await service.remove(adminId);

      expect(result).toEqual(mockSuperAdmin);
      expect(prismaService.superAdmin.delete).toHaveBeenCalledWith({
        where: { id: adminId },
      });
    });
  });
});
