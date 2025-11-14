import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test-utils';
import { faker } from '@faker-js/faker';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import * as roleHelper from '../helpers/role-helper';

vi.mock('../helpers/role-helper');

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validate', () => {
    it('should return user payload when tokenVersion matches', async () => {
      const userId = faker.string.uuid();
      const mockUser = {
        id: userId,
        email: 'user@example.com',
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

      const payload = {
        userId,
        email: 'user@example.com',
        role: 'USER',
        tenantId: mockUser.tenantId,
        tokenVersion: 0,
      };

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(mockUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        'USER' as never,
      );

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
      });
      expect(userFindUniqueMock).toHaveBeenCalledWith({
        where: { id: userId },
        include: { tenant: true },
      });
    });

    it('should throw UnauthorizedException when tokenVersion does not match', async () => {
      const userId = faker.string.uuid();
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        role: 'USER' as const,
        tenantId: faker.string.uuid(),
        tokenVersion: 1, // Token foi revogado (tokenVersion incrementado)
        tenant: {
          id: faker.string.uuid(),
          name: 'Test Tenant',
          slug: 'test-tenant',
          status: 'ACTIVE' as const,
        },
        createdAt: new Date(),
      };

      const payload = {
        userId,
        email: 'user@example.com',
        role: 'USER',
        tenantId: mockUser.tenantId,
        tokenVersion: 0, // Token antigo com tokenVersion 0
      };

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(mockUser);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Token inválido ou revogado',
      );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const userId = faker.string.uuid();

      const payload = {
        userId,
        email: 'user@example.com',
        role: 'USER',
        tokenVersion: 0,
      };

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('should work with tokenVersion undefined (backward compatibility)', async () => {
      const userId = faker.string.uuid();
      const mockUser = {
        id: userId,
        email: 'user@example.com',
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

      const payload = {
        userId,
        email: 'user@example.com',
        role: 'USER',
        tenantId: mockUser.tenantId,
        // tokenVersion não fornecido
      };

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(mockUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        'USER' as never,
      );

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
      });
    });

    it('should throw UnauthorizedException for inactive tenant', async () => {
      const userId = faker.string.uuid();
      const mockUser = {
        id: userId,
        email: 'user@example.com',
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

      const payload = {
        userId,
        email: 'user@example.com',
        role: 'USER',
        tenantId: mockUser.tenantId,
        tokenVersion: 0,
      };

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(mockUser);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Tenant inativo',
      );
    });

    it('should work for SUPER_USER without tenant validation', async () => {
      const userId = faker.string.uuid();
      const mockSuperUser = {
        id: userId,
        email: 'admin@example.com',
        role: 'SUPER_USER' as const,
        tenantId: null,
        tokenVersion: 0,
        tenant: null,
        createdAt: new Date(),
      };

      const payload = {
        userId,
        email: 'admin@example.com',
        role: 'SUPER_USER',
        tokenVersion: 0,
      };

      const userFindUniqueMock = prismaService.user.findUnique;
      userFindUniqueMock.mockResolvedValue(mockSuperUser);
      vi.mocked(roleHelper.getUserRoleFromRbac).mockResolvedValue(
        'SUPER_USER' as never,
      );

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: mockSuperUser.id,
        email: mockSuperUser.email,
        role: mockSuperUser.role,
        tenantId: undefined,
      });
    });
  });
});
