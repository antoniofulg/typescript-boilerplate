import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let userFindMany: jest.Mock;
  let userFindFirst: jest.Mock;
  let userUpdate: jest.Mock;
  let userDelete: jest.Mock;

  beforeEach(async () => {
    prismaService = createMockPrismaService();
    // TypeScript doesn't recognize the mock types correctly, but they are jest.Mock at runtime

    userFindMany = prismaService.user.findMany;

    userFindFirst = prismaService.user.findFirst;

    userUpdate = prismaService.user.update;

    userDelete = prismaService.user.delete;

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
    it('should return all super users without passwordHash', async () => {
      const mockSuperUsers = [
        {
          id: faker.string.uuid(),
          name: 'Admin 1',
          email: 'admin1@example.com',
          passwordHash: 'hashed',
          role: 'SUPER_USER' as const,
          tenantId: null,
          createdAt: new Date(),
        },
        {
          id: faker.string.uuid(),
          name: 'Admin 2',
          email: 'admin2@example.com',
          passwordHash: 'hashed',
          role: 'SUPER_USER' as const,
          tenantId: null,
          createdAt: new Date(),
        },
      ];

      const expectedResult = mockSuperUsers.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ passwordHash: _passwordHash, ...rest }) => rest,
      );

      userFindMany.mockResolvedValue(mockSuperUsers);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(result.every((admin) => !('passwordHash' in admin))).toBe(true);
      expect(userFindMany).toHaveBeenCalledWith({
        where: {
          role: 'SUPER_USER',
          tenantId: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a super user by id without passwordHash', async () => {
      const adminId = faker.string.uuid();
      const mockSuperUser = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        passwordHash: 'hashed',
        role: 'SUPER_USER' as const,
        tenantId: null,
        createdAt: new Date(),
      };

      const expectedResult = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        createdAt: mockSuperUser.createdAt,
      };

      userFindFirst.mockResolvedValue(mockSuperUser);

      const result = await service.findOne(adminId);

      expect(result).toEqual(expectedResult);
      expect('passwordHash' in result).toBe(false);
    });

    it('should throw NotFoundException for non-existent super user', async () => {
      const adminId = faker.string.uuid();

      userFindFirst.mockResolvedValue(null);

      await expect(service.findOne(adminId)).rejects.toThrow(NotFoundException);
    });
  });

  // create method removed for security reasons
  // Super admin accounts should only be created through database seeding

  describe('update', () => {
    it('should update a super user successfully without passwordHash', async () => {
      const adminId = faker.string.uuid();
      const updateData = {
        name: 'Updated Name',
      };

      const existingAdmin = {
        id: adminId,
        name: 'Original Name',
        email: 'admin@example.com',
        passwordHash: 'hashed',
        role: 'SUPER_USER' as const,
        tenantId: null,
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

      userFindFirst.mockResolvedValue(existingAdmin);
      userUpdate.mockResolvedValue(updatedAdmin);

      const result = await service.update(adminId, updateData);

      expect(result).toEqual(expectedResult);
      expect('passwordHash' in result).toBe(false);
      expect(userUpdate).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a super user successfully without passwordHash', async () => {
      const adminId = faker.string.uuid();
      const mockSuperUser = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        passwordHash: 'hashed',
        role: 'SUPER_USER' as const,
        tenantId: null,
        createdAt: new Date(),
      };

      const expectedResult = {
        id: adminId,
        name: 'Test Admin',
        email: 'admin@example.com',
        createdAt: mockSuperUser.createdAt,
      };

      userFindFirst.mockResolvedValue(mockSuperUser);
      userDelete.mockResolvedValue(mockSuperUser);

      const result = await service.remove(adminId);

      expect(result).toEqual(expectedResult);
      expect('passwordHash' in result).toBe(false);
      expect(userDelete).toHaveBeenCalledWith({
        where: { id: adminId },
      });
    });
  });
});
