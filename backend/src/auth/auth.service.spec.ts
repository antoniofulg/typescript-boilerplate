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

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: MockPrismaService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let jwtSignSpy: jest.SpyInstance;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
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
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Create spy for jwtService.sign
    jwtSignSpy = jest.spyOn(jwtService, 'sign');

    // Default config values
    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRES_IN') return '7d';
      return undefined;
    });

    jwtService.sign.mockReturnValue('mock-jwt-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

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
    });

    it('should login a super admin successfully', async () => {
      const mockSuperAdmin = {
        id: faker.string.uuid(),
        email: loginDto.email,
        name: faker.person.fullName(),
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      const userFindFirstMock = prismaService.user.findFirst;
      const superAdminFindUniqueMock = prismaService.superAdmin.findUnique;

      userFindFirstMock.mockResolvedValue(null);

      superAdminFindUniqueMock.mockResolvedValue(mockSuperAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result.user.role).toBe('SUPER_ADMIN');
      expect(superAdminFindUniqueMock).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const userFindFirstMock = prismaService.user.findFirst;
      const superAdminFindUniqueMock = prismaService.superAdmin.findUnique;
      userFindFirstMock.mockResolvedValue(null);
      superAdminFindUniqueMock.mockResolvedValue(null);

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
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

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
        tenant: null,
        createdAt: new Date(),
      };

      const userFindFirstMock = prismaService.user.findFirst;
      const userCreateMock = prismaService.user.create;
      userFindFirstMock.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userCreateMock.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(userCreateMock).toHaveBeenCalled();
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
        tenant: mockTenant,
        createdAt: new Date(),
      };

      const userFindFirstMock = prismaService.user.findFirst;
      const tenantFindUniqueMock = prismaService.tenant.findUnique;
      const userFindUniqueMock = prismaService.user.findUnique;
      const userCreateMock = prismaService.user.create;
      userFindFirstMock.mockResolvedValue(null);
      tenantFindUniqueMock.mockResolvedValue(mockTenant);
      userFindUniqueMock.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userCreateMock.mockResolvedValue(mockUser);

      const result = await service.register(registerDtoWithTenant);

      expect(result.user.tenantId).toBe(tenantId);
      expect(tenantFindUniqueMock).toHaveBeenCalledWith({
        where: { id: tenantId },
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
    it('should return super admin profile', async () => {
      const userId = faker.string.uuid();
      const mockSuperAdmin = {
        id: userId,
        email: 'admin@example.com',
        name: 'Super Admin',
        createdAt: new Date(),
      };

      const superAdminFindUniqueMock = prismaService.superAdmin.findUnique;
      superAdminFindUniqueMock.mockResolvedValue(mockSuperAdmin);

      const result = await service.getProfile(userId, 'SUPER_ADMIN');

      expect(result.role).toBe('SUPER_ADMIN');
      expect(result.email).toBe(mockSuperAdmin.email);
    });

    it('should return regular user profile', async () => {
      const userId = faker.string.uuid();
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        role: 'ADMIN' as const,
        tenantId: faker.string.uuid(),
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

      const result = await service.getProfile(userId, 'ADMIN');

      expect(result.role).toBe('ADMIN');
      expect(result.email).toBe(mockUser.email);
      expect(result.tenant).toBeDefined();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const userId = faker.string.uuid();

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(null);

      await expect(service.getProfile(userId, 'USER')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
