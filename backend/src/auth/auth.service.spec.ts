import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { createMockPrismaService, MockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';
import {
  vi,
  type MockInstance,
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} from 'vitest';

vi.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: MockPrismaService;
  let jwtService: {
    sign: MockInstance<(payload: unknown, options?: unknown) => string>;
  };
  let configService: {
    get: MockInstance<<T = unknown>(key: string) => T | undefined>;
  };
  let jwtSignSpy: MockInstance<(payload: unknown, options?: unknown) => string>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const mockJwtService = {
      sign: vi.fn(),
    };

    const mockConfigService = {
      get: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<typeof jwtService>(JwtService);
    configService = module.get<typeof configService>(ConfigService);

    // No need to spy when already using a vi.fn() mock
    jwtSignSpy = jwtService.sign;

    // Default config values
    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRES_IN') return '16h';
      return undefined;
    });

    jwtService.sign.mockReturnValue('mock-jwt-token');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login a regular user successfully', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        email: loginDto.email,
        name: faker.person.fullName(),
        passwordHash: 'hashed-password',
        role: 'ADMIN' as const,
        tenantId: faker.string.uuid(),
        tokenVersion: 0,
        tenant: {
          id: faker.string.uuid(),
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE' as const,
        },
        createdAt: new Date(),
      };

      const updatedUser = {
        ...mockUser,
        tokenVersion: 1, // Incrementado após login
      };

      const userFindFirstMock = prismaService.user.findFirst;
      const userUpdateMock = prismaService.user.update;
      userFindFirstMock.mockResolvedValue(mockUser);
      userUpdateMock.mockResolvedValue(updatedUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user.role).toBe('ADMIN');
      expect(jwtSignSpy).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
        include: {
          tenant: true,
        },
      });
    });

    it('should login a super user successfully', async () => {
      const mockSuperUser = {
        id: faker.string.uuid(),
        email: loginDto.email,
        name: faker.person.fullName(),
        passwordHash: 'hashed-password',
        role: 'SUPER_USER' as const,
        tenantId: null,
        tokenVersion: 0,
        tenant: null,
        createdAt: new Date(),
      };

      const updatedSuperUser = {
        ...mockSuperUser,
        tokenVersion: 1, // Incrementado após login
      };

      const userFindFirstMock = prismaService.user.findFirst;
      const userUpdateMock = prismaService.user.update;

      userFindFirstMock.mockResolvedValue(mockSuperUser);
      userUpdateMock.mockResolvedValue(updatedSuperUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result.user.role).toBe('SUPER_USER');
      expect(userFindFirstMock).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        include: { tenant: true },
      });
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: mockSuperUser.id },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
        include: {
          tenant: true,
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const userFindFirstMock = prismaService.user.findFirst;
      userFindFirstMock.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        email: loginDto.email,
        name: faker.person.fullName(),
        passwordHash: 'hashed-password',
        role: 'USER' as const,
        tenantId: faker.string.uuid(),
        tokenVersion: 0,
        tenant: {
          id: faker.string.uuid(),
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE' as const,
        },
        createdAt: new Date(),
      };

      const userFindFirstMock = prismaService.user.findFirst;
      userFindFirstMock.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive tenant', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        email: loginDto.email,
        name: faker.person.fullName(),
        passwordHash: 'hashed-password',
        role: 'USER' as const,
        tenantId: faker.string.uuid(),
        tokenVersion: 0,
        tenant: {
          id: faker.string.uuid(),
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'INACTIVE' as const,
        },
        createdAt: new Date(),
      };

      const userFindFirstMock = prismaService.user.findFirst;
      userFindFirstMock.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: faker.person.fullName(),
      email: 'newuser@example.com',
      password: 'password123',
      role: 'USER',
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        ...registerDto,
        passwordHash: 'hashed-password',
        tenantId: null,
        tokenVersion: 0,
        tenant: null,
        createdAt: new Date(),
      };

      const updatedUser = {
        ...mockUser,
        tokenVersion: 1, // Incrementado após registro
      };

      const userFindFirstMock = prismaService.user.findFirst;
      const userCreateMock = prismaService.user.create;
      const userUpdateMock = prismaService.user.update;
      userFindFirstMock.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      userCreateMock.mockResolvedValue(mockUser);
      userUpdateMock.mockResolvedValue(updatedUser);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(userCreateMock).toHaveBeenCalled();
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
        include: {
          tenant: true,
        },
      });
    });

    it('should throw ConflictException for existing email', async () => {
      const existingUser = {
        id: faker.string.uuid(),
        email: registerDto.email,
        name: faker.person.fullName(),
        passwordHash: 'hashed-password',
        role: 'USER' as const,
        tenantId: null,
        createdAt: new Date(),
      };

      const userFindFirstMock = prismaService.user.findFirst;
      userFindFirstMock.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should validate tenant when tenantId is provided', async () => {
      const tenantId = faker.string.uuid();
      const registerDtoWithTenant: RegisterDto = {
        ...registerDto,
        tenantId,
      };

      const mockTenant = {
        id: tenantId,
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      const mockUser = {
        id: faker.string.uuid(),
        ...registerDtoWithTenant,
        passwordHash: 'hashed-password',
        tenantId,
        tokenVersion: 0,
        tenant: mockTenant,
        createdAt: new Date(),
      };

      const updatedUser = {
        ...mockUser,
        tokenVersion: 1, // Incrementado após registro
      };

      const userFindFirstMock = prismaService.user.findFirst;
      const tenantFindUniqueMock = prismaService.tenant.findUnique;
      const userFindUniqueMock = prismaService.user.findUnique;
      const userCreateMock = prismaService.user.create;
      const userUpdateMock = prismaService.user.update;
      userFindFirstMock.mockResolvedValue(null);
      tenantFindUniqueMock.mockResolvedValue(mockTenant);
      userFindUniqueMock.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      userCreateMock.mockResolvedValue(mockUser);
      userUpdateMock.mockResolvedValue(updatedUser);

      const result = await service.register(registerDtoWithTenant);

      expect(result.user.tenantId).toBe(tenantId);
      expect(tenantFindUniqueMock).toHaveBeenCalledWith({
        where: { id: tenantId },
      });
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
        include: {
          tenant: true,
        },
      });
    });

    it('should throw BadRequestException for non-existent tenant', async () => {
      const tenantId = faker.string.uuid();
      const registerDtoWithTenant: RegisterDto = {
        ...registerDto,
        tenantId,
      };

      const userFindFirstMock = prismaService.user.findFirst;
      const tenantFindUniqueMock = prismaService.tenant.findUnique;
      userFindFirstMock.mockResolvedValue(null);
      tenantFindUniqueMock.mockResolvedValue(null);

      await expect(service.register(registerDtoWithTenant)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for inactive tenant', async () => {
      const tenantId = faker.string.uuid();
      const registerDtoWithTenant: RegisterDto = {
        ...registerDto,
        tenantId,
      };

      const mockTenant = {
        id: tenantId,
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'INACTIVE' as const,
        createdAt: new Date(),
      };

      const userFindFirstMock = prismaService.user.findFirst;
      const tenantFindUniqueMock = prismaService.tenant.findUnique;
      userFindFirstMock.mockResolvedValue(null);
      tenantFindUniqueMock.mockResolvedValue(mockTenant);

      await expect(service.register(registerDtoWithTenant)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return super user profile', async () => {
      const userId = faker.string.uuid();
      const mockSuperUser = {
        id: userId,
        email: 'admin@example.com',
        name: 'Super User',
        role: 'SUPER_USER' as const,
        tenantId: null,
        tokenVersion: 0,
        tenant: null,
        createdAt: new Date(),
      };

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(mockSuperUser);

      const result = await service.getProfile(userId);

      expect(result.role).toBe('SUPER_USER');
      expect(result.email).toBe(mockSuperUser.email);
    });

    it('should return regular user profile', async () => {
      const userId = faker.string.uuid();
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        role: 'ADMIN' as const,
        tenantId: faker.string.uuid(),
        tokenVersion: 0,
        tenant: {
          id: faker.string.uuid(),
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE' as const,
        },
        createdAt: new Date(),
      };

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result.role).toBe('ADMIN');
      expect(result.email).toBe(mockUser.email);
      expect(result.tenant).toBeDefined();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const userId = faker.string.uuid();

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should increment tokenVersion and return success message', async () => {
      const userId = faker.string.uuid();
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        role: 'USER' as const,
        tenantId: faker.string.uuid(),
        tokenVersion: 0,
        createdAt: new Date(),
      };

      const userFindUniqueMock = prismaService.user.findUnique;
      const userUpdateMock = prismaService.user.update;

      userFindUniqueMock.mockResolvedValue(mockUser);
      userUpdateMock.mockResolvedValue({
        ...mockUser,
        tokenVersion: 1,
      });

      const result = await service.logout(userId);

      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
      expect(userFindUniqueMock).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userUpdateMock).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const userId = faker.string.uuid();

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(null);

      await expect(service.logout(userId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userFindUniqueMock).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
