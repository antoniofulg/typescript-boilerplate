import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { createTestingModule, MockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';
import { describe, it, expect, beforeEach } from 'vitest';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    const { get, mockPrismaService } = await createTestingModule([
      PermissionsController,
      PermissionsService,
    ]);
    controller = get<PermissionsController>(PermissionsController);
    prismaService = mockPrismaService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a permission', async () => {
      const createDto = {
        key: 'users:create',
        name: 'Create Users',
        description: 'Allow creating users',
      };

      const mockPermission = {
        id: faker.string.uuid(),
        ...createDto,
        createdAt: new Date(),
      };

      prismaService.permission.findUnique.mockResolvedValue(null);
      prismaService.permission.create.mockResolvedValue(mockPermission);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(result.key).toBe(createDto.key);
    });
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [
        {
          id: faker.string.uuid(),
          key: 'users:read',
          name: 'Read Users',
          description: null,
          createdAt: new Date(),
        },
        {
          id: faker.string.uuid(),
          key: 'users:write',
          name: 'Write Users',
          description: null,
          createdAt: new Date(),
        },
      ];

      prismaService.permission.findMany.mockResolvedValue(mockPermissions);

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a permission by id', async () => {
      const permissionId = faker.string.uuid();
      const mockPermission = {
        id: permissionId,
        key: 'users:read',
        name: 'Read Users',
        description: 'Allow reading users',
        createdAt: new Date(),
      };

      prismaService.permission.findUnique.mockResolvedValue(mockPermission);

      const result = await controller.findOne(permissionId);

      expect(result).toBeDefined();
      expect(result.id).toBe(permissionId);
      expect(result.key).toBe('users:read');
    });
  });

  describe('update', () => {
    it('should update a permission', async () => {
      const permissionId = faker.string.uuid();
      const updateDto = {
        name: 'Updated Permission Name',
        description: 'Updated description',
      };

      const mockPermission = {
        id: permissionId,
        key: 'users:read',
        ...updateDto,
        createdAt: new Date(),
      };

      prismaService.permission.findUnique.mockResolvedValue({
        id: permissionId,
        key: 'users:read',
        name: 'Read Users',
        description: null,
        createdAt: new Date(),
      });
      prismaService.permission.update.mockResolvedValue(mockPermission);

      const result = await controller.update(permissionId, updateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(updateDto.description);
    });
  });

  describe('remove', () => {
    it('should delete a permission', async () => {
      const permissionId = faker.string.uuid();
      const mockPermission = {
        id: permissionId,
        key: 'users:read',
        name: 'Read Users',
        description: null,
        createdAt: new Date(),
      };

      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.permission.delete.mockResolvedValue(mockPermission);

      const result = await controller.remove(permissionId);

      expect(result).toBeDefined();
      expect(prismaService.permission.delete).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
    });
  });
});
