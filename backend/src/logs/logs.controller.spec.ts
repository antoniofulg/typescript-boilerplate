import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { FindLogsDto } from './dto/find-logs.dto';
import { faker } from '@faker-js/faker';
import { UserRole, LogAction } from '@prisma/client';
import { vi, MockedFunction } from 'vitest';

describe('LogsController', () => {
  let controller: LogsController;
  let service: {
    findAll: MockedFunction<LogsService['findAll']>;
  };

  const mockLogsService = {
    findAll: vi.fn(),
  };

  const mockSuperUser = {
    userId: faker.string.uuid(),
    email: 'super@example.com',
    role: 'SUPER_USER' as UserRole,
  };

  const mockAdmin = {
    userId: faker.string.uuid(),
    email: 'admin@example.com',
    role: 'ADMIN' as UserRole,
    tenantId: faker.string.uuid(),
  };

  const mockOperator = {
    userId: faker.string.uuid(),
    email: 'operator@example.com',
    role: 'OPERATOR' as UserRole,
    tenantId: faker.string.uuid(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      providers: [
        {
          provide: LogsService,
          useValue: mockLogsService,
        },
      ],
    }).compile();

    controller = module.get<LogsController>(LogsController);
    service = module.get(LogsService);
  });

  describe('findAll', () => {
    it('should return logs for SUPER_USER', async () => {
      const query: FindLogsDto = { page: 1, limit: 20 };
      const expectedResult = {
        logs: [
          {
            id: faker.string.uuid(),
            userId: faker.string.uuid(),
            action: LogAction.CREATE,
            entity: 'User',
            entityId: faker.string.uuid(),
            changes: {},
            ipAddress: null,
            userAgent: null,
            tenantId: null,
            timestamp: new Date(),
            user: null,
            tenant: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockLogsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query, mockSuperUser);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(
        query,
        mockSuperUser.role,
        mockSuperUser.tenantId,
      );
    });

    it('should return logs for ADMIN', async () => {
      const query: FindLogsDto = { page: 1, limit: 20 };
      const expectedResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      mockLogsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query, mockAdmin);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(
        query,
        mockAdmin.role,
        mockAdmin.tenantId,
      );
    });

    it('should throw ForbiddenException for OPERATOR', async () => {
      const query: FindLogsDto = { page: 1, limit: 20 };

      await expect(controller.findAll(query, mockOperator)).rejects.toThrow(
        ForbiddenException,
      );

      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for USER role', async () => {
      const query: FindLogsDto = { page: 1, limit: 20 };
      const mockUser = {
        userId: faker.string.uuid(),
        email: 'user@example.com',
        role: 'USER' as UserRole,
        tenantId: faker.string.uuid(),
      };

      await expect(controller.findAll(query, mockUser)).rejects.toThrow(
        ForbiddenException,
      );

      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should pass filters to service', async () => {
      const query: FindLogsDto = {
        userId: faker.string.uuid(),
        action: LogAction.UPDATE,
        entity: 'User',
        page: 2,
        limit: 10,
      };
      const expectedResult = {
        logs: [],
        total: 0,
        page: 2,
        limit: 10,
      };

      mockLogsService.findAll.mockResolvedValue(expectedResult);

      await controller.findAll(query, mockSuperUser);

      expect(service.findAll).toHaveBeenCalledWith(
        query,
        mockSuperUser.role,
        mockSuperUser.tenantId,
      );
    });

    it('should pass tenantId to service for ADMIN', async () => {
      const query: FindLogsDto = { page: 1, limit: 20 };
      const expectedResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      mockLogsService.findAll.mockResolvedValue(expectedResult);

      await controller.findAll(query, mockAdmin);

      expect(service.findAll).toHaveBeenCalledWith(
        query,
        mockAdmin.role,
        mockAdmin.tenantId,
      );
    });

    it('should pass entities array filter to service', async () => {
      const query: FindLogsDto = {
        entities: ['Tenants', 'Users'],
        page: 1,
        limit: 20,
      };
      const expectedResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      mockLogsService.findAll.mockResolvedValue(expectedResult);

      await controller.findAll(query, mockSuperUser);

      expect(service.findAll).toHaveBeenCalledWith(
        query,
        mockSuperUser.role,
        mockSuperUser.tenantId,
      );
    });
  });
});
