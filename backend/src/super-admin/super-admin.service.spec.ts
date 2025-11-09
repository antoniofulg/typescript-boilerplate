import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let superAdminFindMany: jest.Mock;
  let superAdminFindUnique: jest.Mock;
  let superAdminUpdate: jest.Mock;
  let superAdminDelete: jest.Mock;

  beforeEach(async () => {
    prismaService = createMockPrismaService();
    // TypeScript doesn't recognize the mock types correctly, but they are jest.Mock at runtime

    superAdminFindMany = prismaService.superAdmin.findMany;

    superAdminFindUnique = prismaService.superAdmin.findUnique;

    superAdminUpdate = prismaService.superAdmin.update;

    superAdminDelete = prismaService.superAdmin.delete;

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
    it('should return all super admins without passwordHash', async () => {
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

      const expectedResult = mockSuperAdmins.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ passwordHash: _passwordHash, ...rest }) => rest,
      );

      superAdminFindMany.mockResolvedValue(mockSuperAdmins);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(result.every((admin) => !('passwordHash' in admin))).toBe(true);
      expect(superAdminFindMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a super admin by id without passwordHash', async () => {
      const adminId = faker.string.uuid();
      const mockSuperAdmin = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
      };

      const expectedResult = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        createdAt: mockSuperAdmin.createdAt,
      };

      superAdminFindUnique.mockResolvedValue(mockSuperAdmin);

      const result = await service.findOne(adminId);

      expect(result).toEqual(expectedResult);
      expect('passwordHash' in result).toBe(false);
    });

    it('should throw NotFoundException for non-existent super admin', async () => {
      const adminId = faker.string.uuid();

      superAdminFindUnique.mockResolvedValue(null);

      await expect(service.findOne(adminId)).rejects.toThrow(NotFoundException);
    });
  });

  // create method removed for security reasons
  // Super admin accounts should only be created through database seeding

  describe('update', () => {
    it('should update a super admin successfully without passwordHash', async () => {
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

      const expectedResult = {
        id: adminId,
        name: 'Updated Name',
        email: 'admin@example.com',
        createdAt: existingAdmin.createdAt,
      };

      superAdminFindUnique
        .mockResolvedValueOnce(existingAdmin)
        .mockResolvedValueOnce(existingAdmin);
      superAdminUpdate.mockResolvedValue(updatedAdmin);

      const result = await service.update(adminId, updateData);

      expect(result).toEqual(expectedResult);
      expect('passwordHash' in result).toBe(false);
      expect(superAdminUpdate).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a super admin successfully without passwordHash', async () => {
      const adminId = faker.string.uuid();
      const mockSuperAdmin = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
      };

      const expectedResult = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        createdAt: mockSuperAdmin.createdAt,
      };

      superAdminFindUnique.mockResolvedValue(mockSuperAdmin);
      superAdminDelete.mockResolvedValue(mockSuperAdmin);

      const result = await service.remove(adminId);

      expect(result).toEqual(expectedResult);
      expect('passwordHash' in result).toBe(false);
      expect(superAdminDelete).toHaveBeenCalledWith({
        where: { id: adminId },
      });
    });
  });
});
