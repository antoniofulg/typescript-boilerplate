import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { createMockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: faker.person.fullName(),
      email: 'newuser@example.com',
      password: 'password123',
      role: 'USER',
    };

    it('should create a user successfully', async () => {
      const tenantId = faker.string.uuid();
      const mockUser = {
        id: faker.string.uuid(),
        ...createUserDto,
        passwordHash: 'hashed-password',
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE' as const,
        },
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto, tenantId);

      expect(result).toEqual(mockUser);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for existing email in tenant', async () => {
      const tenantId = faker.string.uuid();
      const existingUser = {
        id: faker.string.uuid(),
        email: createUserDto.email,
        name: faker.person.fullName(),
        passwordHash: 'hashed-password',
        role: 'USER' as const,
        tenantId,
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto, tenantId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ForbiddenException when trying to create user in different tenant', async () => {
      const currentUserTenantId = faker.string.uuid();
      const differentTenantId = faker.string.uuid();

      const createDtoWithTenant: CreateUserDto = {
        ...createUserDto,
        tenantId: differentTenantId,
      };

      await expect(
        service.create(createDtoWithTenant, currentUserTenantId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all users for a tenant', async () => {
      const tenantId = faker.string.uuid();
      const mockUsers = [
        {
          id: faker.string.uuid(),
          email: 'user1@example.com',
          name: 'User 1',
          passwordHash: 'hashed',
          role: 'USER' as const,
          tenantId,
          tenant: {
            id: tenantId,
            name: 'Test Tenant',
            slug: 'test-tenant',
            status: 'ACTIVE' as const,
          },
          createdAt: new Date(),
        },
      ];

      prismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll(tenantId);

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        include: { tenant: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = faker.string.uuid();
      const tenantId = faker.string.uuid();
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
        role: 'USER' as const,
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE' as const,
        },
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(userId, tenantId);

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const userId = faker.string.uuid();

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when accessing user from different tenant', async () => {
      const userId = faker.string.uuid();
      const currentUserTenantId = faker.string.uuid();
      const differentTenantId = faker.string.uuid();

      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
        role: 'USER' as const,
        tenantId: differentTenantId,
        tenant: {
          id: differentTenantId,
          name: 'Other Tenant',
          slug: 'other-tenant',
          status: 'ACTIVE' as const,
        },
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.findOne(userId, currentUserTenantId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const userId = faker.string.uuid();
      const tenantId = faker.string.uuid();
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Original Name',
        passwordHash: 'hashed',
        role: 'USER' as const,
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE' as const,
        },
        createdAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        ...updateUserDto,
      };

      prismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(existingUser);
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto, tenantId);

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      const userId = faker.string.uuid();
      const tenantId = faker.string.uuid();

      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
        role: 'USER' as const,
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE' as const,
        },
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(userId, tenantId);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
