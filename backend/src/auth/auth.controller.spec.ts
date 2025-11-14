import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedirectIfAuthenticatedGuard } from './guards/redirect-if-authenticated.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { faker } from '@faker-js/faker';
import {
  vi,
  MockedFunction,
  type MockInstance,
  describe,
  beforeEach,
  it,
  expect,
} from 'vitest';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: MockedFunction<AuthService['login']>;
    register: MockedFunction<AuthService['register']>;
    logout: MockedFunction<AuthService['logout']>;
    getProfile: MockedFunction<AuthService['getProfile']>;
  };
  let loginSpy: MockInstance<AuthService['login']>;
  let registerSpy: MockInstance<AuthService['register']>;
  let logoutSpy: MockInstance<AuthService['logout']>;
  let getProfileSpy: MockInstance<AuthService['getProfile']>;

  beforeEach(async () => {
    const mockAuthService = {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getProfile: vi.fn(),
    };

    const mockJwtService = {
      verify: vi.fn(),
      sign: vi.fn(),
    };

    const mockConfigService = {
      get: vi.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: RedirectIfAuthenticatedGuard,
          useValue: {
            canActivate: vi.fn().mockReturnValue(true),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn().mockReturnValue(true), // Route is public
          },
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
    })
      .overrideGuard(RedirectIfAuthenticatedGuard)
      .useValue({
        canActivate: vi.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    // Create spies for the mock methods
    loginSpy = vi.spyOn(authService, 'login') as MockInstance<
      AuthService['login']
    >;
    registerSpy = vi.spyOn(authService, 'register') as MockInstance<
      AuthService['register']
    >;
    logoutSpy = vi.spyOn(authService, 'logout') as MockInstance<
      AuthService['logout']
    >;
    getProfileSpy = vi.spyOn(authService, 'getProfile') as MockInstance<
      AuthService['getProfile']
    >;
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        accessToken: 'mock-token',
        user: {
          id: faker.string.uuid(),
          email: loginDto.email,
          name: faker.person.fullName(),
          role: 'USER',
        },
      };

      loginSpy.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(loginSpy).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('should call authService.register with correct parameters', async () => {
      const registerDto: RegisterDto = {
        name: faker.person.fullName(),
        email: 'newuser@example.com',
        password: 'password123',
        role: 'USER',
      };

      const mockResponse = {
        accessToken: 'mock-token',
        user: {
          id: faker.string.uuid(),
          email: registerDto.email,
          name: registerDto.name,
          role: registerDto.role,
        },
      };

      registerSpy.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(registerSpy).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with user userId', async () => {
      const mockUser = {
        userId: faker.string.uuid(),
        email: 'user@example.com',
        role: 'USER',
        tenantId: faker.string.uuid(),
      };

      const mockResponse = {
        message: 'Logout realizado com sucesso',
      };

      logoutSpy.mockResolvedValue(mockResponse);

      const result = await controller.logout(mockUser);

      expect(logoutSpy).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile with user info', async () => {
      const mockUser = {
        userId: faker.string.uuid(),
        email: 'user@example.com',
        role: 'USER',
        tenantId: faker.string.uuid(),
      };

      const mockProfile = {
        id: mockUser.userId,
        email: mockUser.email,
        name: faker.person.fullName(),
        role: mockUser.role as 'USER',
        tenantId: mockUser.tenantId,
        tenant: {
          id: mockUser.tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE' as const,
        },
      };

      getProfileSpy.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockUser);

      expect(getProfileSpy).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toEqual(mockProfile);
    });
  });
});
