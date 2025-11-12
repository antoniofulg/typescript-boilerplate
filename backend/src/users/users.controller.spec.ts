import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { faker } from '@faker-js/faker';
import { UserRole } from '@prisma/client';
import { vi, MockedFunction } from 'vitest';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    create: MockedFunction<UsersService['create']>;
    findAll: MockedFunction<UsersService['findAll']>;
    findOne: MockedFunction<UsersService['findOne']>;
    update: MockedFunction<UsersService['update']>;
    remove: MockedFunction<UsersService['remove']>;
    verifyPasswordForSuperUserOperation: MockedFunction<
      UsersService['verifyPasswordForSuperUserOperation']
    >;
  };

  const mockUsersService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    verifyPasswordForSuperUserOperation: vi.fn(),
  };

  const mockCurrentUser = {
    userId: faker.string.uuid(),
    email: 'super@example.com',
    role: 'SUPER_USER' as UserRole,
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        name: faker.person.fullName(),
        email: 'user@example.com',
        password: 'password123',
        role: UserRole.USER,
      };
      const expectedResult = {
        id: faker.string.uuid(),
        ...createUserDto,
        tenantId: null,
        createdAt: new Date(),
      };

      mockUsersService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto, mockCurrentUser);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(
        createUserDto,
        mockCurrentUser.userId,
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const expectedResult = [
        {
          id: faker.string.uuid(),
          name: 'User 1',
          email: 'user1@example.com',
          role: UserRole.USER,
          tenantId: faker.string.uuid(),
          createdAt: new Date(),
        },
      ];

      mockUsersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = faker.string.uuid();
      const expectedResult = {
        id: userId,
        name: 'User',
        email: 'user@example.com',
        role: UserRole.USER,
        tenantId: faker.string.uuid(),
        createdAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(userId);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const userId = faker.string.uuid();
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      const existingUser = {
        id: userId,
        name: 'Original Name',
        email: 'user@example.com',
        role: UserRole.USER,
        tenantId: faker.string.uuid(),
        createdAt: new Date(),
      };
      const expectedResult = {
        ...existingUser,
        ...updateUserDto,
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);
      mockUsersService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(
        userId,
        updateUserDto,
        mockCurrentUser,
      );

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        mockCurrentUser.userId,
      );
    });

    it('should require password confirmation when updating SUPER_USER', async () => {
      const userId = faker.string.uuid();
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      const existingUser = {
        id: userId,
        name: 'Super User',
        email: 'super@example.com',
        role: 'SUPER_USER' as UserRole,
        tenantId: null,
        createdAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);

      await expect(
        controller.update(userId, updateUserDto, mockCurrentUser),
      ).rejects.toThrow(BadRequestException);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(service.update).not.toHaveBeenCalled();
    });

    it('should require password confirmation when changing role to SUPER_USER', async () => {
      const userId = faker.string.uuid();
      const updateUserDto: UpdateUserDto = {
        role: 'SUPER_USER' as UserRole,
      };
      const existingUser = {
        id: userId,
        name: 'User',
        email: 'user@example.com',
        role: UserRole.ADMIN,
        tenantId: faker.string.uuid(),
        createdAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);

      await expect(
        controller.update(userId, updateUserDto, mockCurrentUser),
      ).rejects.toThrow(BadRequestException);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(service.update).not.toHaveBeenCalled();
    });

    it('should allow update with password confirmation for SUPER_USER', async () => {
      const userId = faker.string.uuid();
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        passwordConfirmation: 'password123',
      };
      const existingUser = {
        id: userId,
        name: 'Super User',
        email: 'super@example.com',
        role: 'SUPER_USER' as UserRole,
        tenantId: null,
        createdAt: new Date(),
      };
      const expectedResult = {
        ...existingUser,
        ...updateUserDto,
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);
      mockUsersService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(
        userId,
        updateUserDto,
        mockCurrentUser,
      );

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      const userId = faker.string.uuid();
      const deleteUserDto: DeleteUserDto = {};
      const existingUser = {
        id: userId,
        name: 'User',
        email: 'user@example.com',
        role: UserRole.USER,
        tenantId: faker.string.uuid(),
        createdAt: new Date(),
      };
      const expectedResult = {
        ...existingUser,
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);
      mockUsersService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(
        userId,
        deleteUserDto,
        mockCurrentUser,
      );

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(service.remove).toHaveBeenCalledWith(userId);
    });

    it('should require password confirmation when deleting SUPER_USER', async () => {
      const userId = faker.string.uuid();
      const deleteUserDto: DeleteUserDto = {};
      const existingUser = {
        id: userId,
        name: 'Super User',
        email: 'super@example.com',
        role: 'SUPER_USER' as UserRole,
        tenantId: null,
        createdAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);

      await expect(
        controller.remove(userId, deleteUserDto, mockCurrentUser),
      ).rejects.toThrow(BadRequestException);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(service.remove).not.toHaveBeenCalled();
    });

    it('should allow delete with password confirmation for SUPER_USER', async () => {
      const userId = faker.string.uuid();
      const deleteUserDto: DeleteUserDto = {
        passwordConfirmation: 'password123',
      };
      const existingUser = {
        id: userId,
        name: 'Super User',
        email: 'super@example.com',
        role: 'SUPER_USER' as UserRole,
        tenantId: null,
        createdAt: new Date(),
      };
      const expectedResult = {
        ...existingUser,
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);
      mockUsersService.verifyPasswordForSuperUserOperation.mockResolvedValue(
        undefined,
      );
      mockUsersService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(
        userId,
        deleteUserDto,
        mockCurrentUser,
      );

      expect(result).toEqual(expectedResult);
      expect(service.verifyPasswordForSuperUserOperation).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        deleteUserDto.passwordConfirmation,
      );
      expect(service.remove).toHaveBeenCalled();
    });
  });
});
