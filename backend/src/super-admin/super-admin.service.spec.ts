import { NotFoundException } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { createTestingModule, MockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';
describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    const { get, mockPrismaService } = await createTestingModule([
      SuperAdminService,
    ]);
    service = get<SuperAdminService>(SuperAdminService);
    prismaService = mockPrismaService;
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
        ({ passwordHash: _passwordHash, ...rest }) => {
          void _passwordHash; // Explicitly mark as used to avoid lint error
          return rest;
        },
      );

      prismaService.user.findMany.mockResolvedValue(mockSuperUsers);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(result.every((admin) => !('passwordHash' in admin))).toBe(true);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
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

      prismaService.user.findFirst.mockResolvedValue(mockSuperUser);

      const result = await service.findOne(adminId);

      expect(result.id).toBe(adminId);
      expect(result.name).toBe('Test Admin');
      expect(result.email).toBe('admin@example.com');
      expect(result.createdAt).toEqual(mockSuperUser.createdAt);
      expect('passwordHash' in result).toBe(false);
    });

    it('should throw NotFoundException for non-existent super user', async () => {
      const adminId = faker.string.uuid();

      prismaService.user.findFirst.mockResolvedValue(null);

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

      prismaService.user.findFirst.mockResolvedValue(existingAdmin);
      prismaService.user.update.mockResolvedValue(updatedAdmin);

      const result = await service.update(adminId, updateData);

      expect(result.id).toBe(adminId);
      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe('admin@example.com');
      expect(result.createdAt).toEqual(existingAdmin.createdAt);
      expect('passwordHash' in result).toBe(false);
      expect(prismaService.user.update).toHaveBeenCalled();
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

      prismaService.user.findFirst.mockResolvedValue(mockSuperUser);
      prismaService.user.delete.mockResolvedValue(mockSuperUser);

      const result = await service.remove(adminId);

      expect(result.id).toBe(adminId);
      expect(result.name).toBe('Test Admin');
      expect(result.email).toBe('admin@example.com');
      expect(result.createdAt).toEqual(mockSuperUser.createdAt);
      expect('passwordHash' in result).toBe(false);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: adminId },
      });
    });
  });
});
