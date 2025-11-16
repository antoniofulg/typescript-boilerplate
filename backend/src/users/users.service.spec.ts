import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { createTestingModule, MockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { UserRole, type User } from '@prisma/client';
import { vi } from 'vitest';
import * as roleHelper from '../auth/helpers/role-helper';

vi.mock('bcrypt');
vi.mock('../auth/helpers/role-helper');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    const { get, mockPrismaService } = await createTestingModule([
      UsersService,
    ]);
    service = get<UsersService>(UsersService);
    prismaService = mockPrismaService;
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: faker.person.fullName(),
      email: 'newuser@example.com',
      password: 'password123',
      role: UserRole.USER,
    };

    it('should create a user successfully', async () => {
      const tenantId = faker.string.uuid();
      const userId = faker.string.uuid();
      const currentSuperUserId = faker.string.uuid();
      const mockUser = {
        id: userId,
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: 'hashed-password',
        role: createUserDto.role,
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE',
        },
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'ACTIVE',
        createdAt: new Date(),
      });
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      prismaService.user.create.mockResolvedValue(mockUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        createUserDto.role,
      );

      const result = await service.create(
        { ...createUserDto, tenantId },
        currentSuperUserId,
      );

      expect(result).toEqual({
        id: userId,
        name: createUserDto.name,
        email: createUserDto.email,
        role: createUserDto.role,
        tenantId,
        tenant: mockUser.tenant,
        createdAt: mockUser.createdAt,
      });
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should create a user without tenant', async () => {
      const userId = faker.string.uuid();
      const currentSuperUserId = faker.string.uuid();
      const mockUser = {
        id: userId,
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: 'hashed-password',
        role: createUserDto.role,
        tenantId: null,
        tenant: null,
        createdAt: new Date(),
      };

      prismaService.user.findFirst.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      prismaService.user.create.mockResolvedValue(mockUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        createUserDto.role,
      );

      const result = await service.create(createUserDto, currentSuperUserId);

      expect(result.tenantId).toBeNull();
      expect(result.tenant).toBeNull();
    });

    it('should create SUPER_USER with password confirmation', async () => {
      const userId = faker.string.uuid();
      const currentSuperUserId = faker.string.uuid();
      const mockSuperUser: User = {
        id: currentSuperUserId,
        email: 'super@example.com',
        passwordHash: 'hashed-super-password',
        role: UserRole.SUPER_USER,
        tenantId: null,
        name: 'Super User',
        createdAt: new Date(),
      };
      const mockNewSuperUser = {
        id: userId,
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: 'hashed-password',
        role: UserRole.SUPER_USER,
        tenantId: null,
        tenant: null,
        createdAt: new Date(),
      };

      prismaService.user.findUnique
        .mockResolvedValueOnce(mockSuperUser) // For password verification
        .mockResolvedValueOnce(null); // For email check
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockNewSuperUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        UserRole.SUPER_USER,
      );

      const result = await service.create(
        {
          ...createUserDto,
          role: UserRole.SUPER_USER,
          passwordConfirmation: 'super-password',
        },
        currentSuperUserId,
      );

      expect(result.role).toBe(UserRole.SUPER_USER);
      expect(result.tenantId).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('should throw BadRequestException when creating SUPER_USER without password confirmation', async () => {
      const currentSuperUserId = faker.string.uuid();

      await expect(
        service.create(
          {
            ...createUserDto,
            role: UserRole.SUPER_USER,
          },
          currentSuperUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when password confirmation is invalid', async () => {
      const currentSuperUserId = faker.string.uuid();
      const mockSuperUser: User = {
        id: currentSuperUserId,
        email: 'super@example.com',
        passwordHash: 'hashed-super-password',
        role: UserRole.SUPER_USER,
        tenantId: null,
        name: 'Super User',
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockSuperUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.create(
          {
            ...createUserDto,
            role: UserRole.SUPER_USER,
            passwordConfirmation: 'wrong-password',
          },
          currentSuperUserId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException for existing email in tenant', async () => {
      const tenantId = faker.string.uuid();
      const currentSuperUserId = faker.string.uuid();
      const existingUser = {
        id: faker.string.uuid(),
        email: createUserDto.email,
        name: faker.person.fullName(),
        passwordHash: 'hashed-password',
        role: UserRole.USER,
        tenantId,
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        service.create({ ...createUserDto, tenantId }, currentSuperUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for existing email without tenant', async () => {
      const currentSuperUserId = faker.string.uuid();
      const existingUser = {
        id: faker.string.uuid(),
        email: createUserDto.email,
        name: faker.person.fullName(),
        passwordHash: 'hashed-password',
        role: UserRole.USER,
        tenantId: null,
        createdAt: new Date(),
      };

      prismaService.user.findFirst.mockResolvedValue(existingUser);

      await expect(
        service.create(createUserDto, currentSuperUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for invalid tenant', async () => {
      const tenantId = faker.string.uuid();
      const currentSuperUserId = faker.string.uuid();

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ ...createUserDto, tenantId }, currentSuperUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all users without passwordHash', async () => {
      const mockUsers = [
        {
          id: faker.string.uuid(),
          email: 'user1@example.com',
          name: 'User 1',
          passwordHash: 'hashed',
          role: UserRole.USER,
          tenantId: faker.string.uuid(),
          tenant: {
            id: faker.string.uuid(),
            name: 'Test Tenant',
            slug: 'test-tenant',
            status: 'ACTIVE',
          },
          createdAt: new Date(),
        },
        {
          id: faker.string.uuid(),
          email: 'user2@example.com',
          name: 'User 2',
          passwordHash: 'hashed',
          role: UserRole.ADMIN,
          tenantId: null,
          tenant: null,
          createdAt: new Date(),
        },
      ];

      prismaService.user.findMany.mockResolvedValue(mockUsers);
      vi.mocked(roleHelper.getUserRoleFromRbac)
        .mockResolvedValueOnce(UserRole.USER)
        .mockResolvedValueOnce(UserRole.ADMIN);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(result[1]).not.toHaveProperty('passwordHash');
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        include: { tenant: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id without passwordHash', async () => {
      const userId = faker.string.uuid();
      const tenantId = faker.string.uuid();
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
        role: UserRole.USER,
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE',
        },
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        UserRole.USER,
      );

      const result = await service.findOne(userId);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(userId);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const userId = faker.string.uuid();

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const userId = faker.string.uuid();
      const tenantId = faker.string.uuid();
      const currentSuperUserId = faker.string.uuid();
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Original Name',
        passwordHash: 'hashed',
        role: UserRole.USER,
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE',
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
      vi.mocked(roleHelper.getUserRoleFromRbac)
        .mockResolvedValueOnce(UserRole.USER) // For isTargetSuperUser check
        .mockResolvedValueOnce(UserRole.USER); // For excludePasswordHash

      const result = await service.update(
        userId,
        updateUserDto,
        currentSuperUserId,
      );

      expect(result.name).toBe(updateUserDto.name);
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should set tenantId to null when changing role to SUPER_USER', async () => {
      const userId = faker.string.uuid();
      const tenantId = faker.string.uuid();
      const currentSuperUserId = faker.string.uuid();
      const mockSuperUser: User = {
        id: currentSuperUserId,
        email: 'super@example.com',
        passwordHash: 'hashed-super-password',
        role: UserRole.SUPER_USER,
        tenantId: null,
        name: 'Super User',
        createdAt: new Date(),
      };
      const existingUser = {
        id: userId,
        email: 'user@example.com',
        name: 'User',
        passwordHash: 'hashed',
        role: UserRole.ADMIN,
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE',
        },
        createdAt: new Date(),
      };
      const updatedUser = {
        ...existingUser,
        role: UserRole.SUPER_USER,
        tenantId: null,
        tenant: null,
      };

      prismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(mockSuperUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      prismaService.user.update.mockResolvedValue(updatedUser);
      vi.mocked(roleHelper.getUserRoleFromRbac)
        .mockResolvedValueOnce(UserRole.ADMIN) // For currentRole in update
        .mockResolvedValueOnce(UserRole.SUPER_USER) // For verifySuperUserPassword
        .mockResolvedValueOnce(UserRole.SUPER_USER); // For excludePasswordHash

      const result = await service.update(
        userId,
        {
          role: UserRole.SUPER_USER,
          passwordConfirmation: 'super-password',
        },
        currentSuperUserId,
      );

      expect(result.role).toBe(UserRole.SUPER_USER);
      expect(result.tenantId).toBeNull();
    });

    it('should require password confirmation when updating SUPER_USER', async () => {
      const userId = faker.string.uuid();
      const currentSuperUserId = faker.string.uuid();
      const existingUser: User & { tenant: null } = {
        id: userId,
        email: 'super@example.com',
        name: 'Super User',
        passwordHash: 'hashed',
        role: UserRole.SUPER_USER,
        tenantId: null,
        tenant: null,
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        UserRole.SUPER_USER,
      );

      await expect(
        service.update(userId, { name: 'New Name' }, currentSuperUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate email', async () => {
      const userId = faker.string.uuid();
      const tenantId = faker.string.uuid();
      const currentSuperUserId = faker.string.uuid();
      const existingUser = {
        id: userId,
        email: 'user@example.com',
        name: 'User',
        passwordHash: 'hashed',
        role: UserRole.USER,
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE',
        },
        createdAt: new Date(),
      };
      const duplicateUser = {
        id: faker.string.uuid(),
        email: 'newemail@example.com',
        name: 'Other User',
        passwordHash: 'hashed',
        role: UserRole.USER,
        tenantId,
        createdAt: new Date(),
      };

      prismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(existingUser);
      prismaService.user.findFirst.mockResolvedValue(duplicateUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        UserRole.USER,
      );

      await expect(
        service.update(
          userId,
          { email: 'newemail@example.com' },
          currentSuperUserId,
        ),
      ).rejects.toThrow(ConflictException);
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
        role: UserRole.USER,
        tenantId,
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE',
        },
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.delete.mockResolvedValue(mockUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        UserRole.USER,
      );

      const result = await service.remove(userId);

      expect(result).not.toHaveProperty('passwordHash');
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
        include: { tenant: true },
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const userId = faker.string.uuid();

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyPasswordForSuperUserOperation', () => {
    it('should verify password successfully', async () => {
      const superUserId = faker.string.uuid();
      const mockSuperUser: User = {
        id: superUserId,
        email: 'super@example.com',
        passwordHash: 'hashed-password',
        role: UserRole.SUPER_USER,
        tenantId: null,
        name: 'Super User',
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockSuperUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        UserRole.SUPER_USER,
      );

      await expect(
        service.verifyPasswordForSuperUserOperation(superUserId, 'password'),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException for invalid password', async () => {
      const superUserId = faker.string.uuid();
      const mockSuperUser: User = {
        id: superUserId,
        email: 'super@example.com',
        passwordHash: 'hashed-password',
        role: UserRole.SUPER_USER,
        tenantId: null,
        name: 'Super User',
        createdAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockSuperUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        UserRole.SUPER_USER,
      );

      await expect(
        service.verifyPasswordForSuperUserOperation(superUserId, 'wrong'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
