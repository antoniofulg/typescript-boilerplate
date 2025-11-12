import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { faker } from '@faker-js/faker';
import { vi, MockedFunction } from 'vitest';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: MockedFunction<AuthService['login']>;
    register: MockedFunction<AuthService['register']>;
    getProfile: MockedFunction<AuthService['getProfile']>;
  };
  let loginSpy: ReturnType<typeof vi.spyOn>;
  let registerSpy: ReturnType<typeof vi.spyOn>;
  let getProfileSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const mockAuthService = {
      login: vi.fn(),
      register: vi.fn(),
      getProfile: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    // Create spies for the mock methods
    loginSpy = vi.spyOn(authService, 'login');
    registerSpy = vi.spyOn(authService, 'register');
    getProfileSpy = vi.spyOn(authService, 'getProfile');
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
