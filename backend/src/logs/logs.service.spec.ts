import { LogsService } from './logs.service';
import { createTestingModule, MockPrismaService } from '../test-utils';
import { faker } from '@faker-js/faker';
import { LogAction } from '@prisma/client';

describe('LogsService', () => {
  let service: LogsService;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    const { get, mockPrismaService } = await createTestingModule([LogsService]);
    service = get<LogsService>(LogsService);
    prismaService = mockPrismaService;
  });

  describe('createLog', () => {
    it('should create a log successfully', async () => {
      const userId = faker.string.uuid();
      const tenantId = faker.string.uuid();
      const logId = faker.string.uuid();
      const createData = {
        userId,
        action: LogAction.CREATE,
        entity: 'User',
        entityId: faker.string.uuid(),
        changes: { name: 'Test User', email: 'test@example.com' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        tenantId,
      };

      const mockLog = {
        id: logId,
        userId: createData.userId,
        action: createData.action,
        entity: createData.entity,
        entityId: createData.entityId,
        changes: createData.changes,
        ipAddress: createData.ipAddress,
        userAgent: createData.userAgent,
        tenantId: createData.tenantId,
        timestamp: new Date(),
        user: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
        },
        tenant: {
          id: tenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
        },
      };

      prismaService.log.create.mockResolvedValue(mockLog);

      const result = await service.createLog(createData);

      expect(result).toMatchObject({
        id: logId,
        userId: createData.userId,
        action: createData.action,
        entity: createData.entity,
        entityId: createData.entityId,
        changes: createData.changes,
        ipAddress: createData.ipAddress,
        userAgent: createData.userAgent,
        tenantId: createData.tenantId,
      });
      expect(prismaService.log.create).toHaveBeenCalled();
    });

    it('should create a log without optional fields', async () => {
      const logId = faker.string.uuid();
      const createData = {
        action: LogAction.DELETE,
        entity: 'User',
        entityId: faker.string.uuid(),
        changes: { deleted: true },
      };

      const mockLog = {
        id: logId,
        userId: null,
        action: createData.action,
        entity: createData.entity,
        entityId: createData.entityId,
        changes: createData.changes,
        ipAddress: null,
        userAgent: null,
        tenantId: null,
        timestamp: new Date(),
        user: null,
        tenant: null,
      };

      prismaService.log.create.mockResolvedValue(mockLog);

      const result = await service.createLog(createData);

      expect(result.userId).toBeNull();
      expect(result.ipAddress).toBeNull();
      expect(result.userAgent).toBeNull();
      expect(result.tenantId).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return logs with pagination', async () => {
      const mockLogs = [
        {
          id: faker.string.uuid(),
          userId: faker.string.uuid(),
          action: LogAction.CREATE,
          entity: 'User',
          entityId: faker.string.uuid(),
          changes: { name: 'User 1' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          tenantId: faker.string.uuid(),
          timestamp: new Date(),
          user: {
            id: faker.string.uuid(),
            name: 'User 1',
            email: 'user1@example.com',
          },
          tenant: null,
        },
        {
          id: faker.string.uuid(),
          userId: faker.string.uuid(),
          action: LogAction.UPDATE,
          entity: 'Tenant',
          entityId: faker.string.uuid(),
          changes: { name: 'Updated Tenant' },
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0',
          tenantId: faker.string.uuid(),
          timestamp: new Date(),
          user: {
            id: faker.string.uuid(),
            name: 'User 2',
            email: 'user2@example.com',
          },
          tenant: null,
        },
      ];

      prismaService.log.findMany.mockResolvedValue(mockLogs);
      prismaService.log.count.mockResolvedValue(2);

      const result = await service.findAll(
        { page: 1, limit: 20 },
        'SUPER_USER',
      );

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(prismaService.log.findMany).toHaveBeenCalled();
      expect(prismaService.log.count).toHaveBeenCalled();
    });

    it('should filter logs by userId', async () => {
      const userId = faker.string.uuid();
      const mockLogs = [
        {
          id: faker.string.uuid(),
          userId,
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
      ];

      prismaService.log.findMany.mockResolvedValue(mockLogs);
      prismaService.log.count.mockResolvedValue(1);

      const result = await service.findAll(
        { userId, page: 1, limit: 20 },
        'SUPER_USER',
      );

      expect(result.logs).toHaveLength(1);
      expect(prismaService.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
          }),
        }),
      );
    });

    it('should filter logs by action', async () => {
      const mockLogs = [
        {
          id: faker.string.uuid(),
          userId: faker.string.uuid(),
          action: LogAction.DELETE,
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
      ];

      prismaService.log.findMany.mockResolvedValue(mockLogs);
      prismaService.log.count.mockResolvedValue(1);

      const result = await service.findAll(
        { action: LogAction.DELETE, page: 1, limit: 20 },
        'SUPER_USER',
      );

      expect(result.logs).toHaveLength(1);
      expect(prismaService.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: LogAction.DELETE,
          }),
        }),
      );
    });

    it('should filter logs by entity', async () => {
      const mockLogs = [
        {
          id: faker.string.uuid(),
          userId: faker.string.uuid(),
          action: LogAction.CREATE,
          entity: 'Tenant',
          entityId: faker.string.uuid(),
          changes: {},
          ipAddress: null,
          userAgent: null,
          tenantId: null,
          timestamp: new Date(),
          user: null,
          tenant: null,
        },
      ];

      prismaService.log.findMany.mockResolvedValue(mockLogs);
      prismaService.log.count.mockResolvedValue(1);

      const result = await service.findAll(
        { entity: 'Tenant', page: 1, limit: 20 },
        'SUPER_USER',
      );

      expect(result.logs).toHaveLength(1);
      expect(prismaService.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: 'Tenant',
          }),
        }),
      );
    });

    it('should filter logs by multiple entities', async () => {
      const mockLogs = [
        {
          id: faker.string.uuid(),
          userId: faker.string.uuid(),
          action: LogAction.CREATE,
          entity: 'Tenants',
          entityId: faker.string.uuid(),
          changes: {},
          ipAddress: null,
          userAgent: null,
          tenantId: null,
          timestamp: new Date(),
          user: null,
          tenant: null,
        },
        {
          id: faker.string.uuid(),
          userId: faker.string.uuid(),
          action: LogAction.UPDATE,
          entity: 'Users',
          entityId: faker.string.uuid(),
          changes: {},
          ipAddress: null,
          userAgent: null,
          tenantId: null,
          timestamp: new Date(),
          user: null,
          tenant: null,
        },
      ];

      prismaService.log.findMany.mockResolvedValue(mockLogs);
      prismaService.log.count.mockResolvedValue(2);

      const result = await service.findAll(
        { entities: ['Tenants', 'Users'], page: 1, limit: 20 },
        'SUPER_USER',
      );

      expect(result.logs).toHaveLength(2);
      expect(prismaService.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: { in: ['Tenants', 'Users'] },
          }),
        }),
      );
    });

    it('should filter logs by date range', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';
      const mockLogs: unknown[] = [];

      prismaService.log.findMany.mockResolvedValue(mockLogs);
      prismaService.log.count.mockResolvedValue(0);

      await service.findAll(
        { startDate, endDate, page: 1, limit: 20 },
        'SUPER_USER',
      );

      expect(prismaService.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        }),
      );
    });

    it('should filter logs by tenantId for ADMIN users', async () => {
      const tenantId = faker.string.uuid();
      const mockLogs = [
        {
          id: faker.string.uuid(),
          userId: faker.string.uuid(),
          action: LogAction.CREATE,
          entity: 'User',
          entityId: faker.string.uuid(),
          changes: {},
          ipAddress: null,
          userAgent: null,
          tenantId,
          timestamp: new Date(),
          user: null,
          tenant: null,
        },
      ];

      prismaService.log.findMany.mockResolvedValue(mockLogs);
      prismaService.log.count.mockResolvedValue(1);

      const result = await service.findAll(
        { page: 1, limit: 20 },
        'ADMIN',
        tenantId,
      );

      expect(result.logs).toHaveLength(1);
      expect(prismaService.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
          }),
        }),
      );
    });

    it('should allow SUPER_USER to filter by tenantId', async () => {
      const tenantId = faker.string.uuid();
      const mockLogs: unknown[] = [];

      prismaService.log.findMany.mockResolvedValue(mockLogs);
      prismaService.log.count.mockResolvedValue(0);

      await service.findAll({ tenantId, page: 1, limit: 20 }, 'SUPER_USER');

      expect(prismaService.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
          }),
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      const mockLogs: unknown[] = [];

      prismaService.log.findMany.mockResolvedValue(mockLogs);
      prismaService.log.count.mockResolvedValue(100);

      const result = await service.findAll(
        { page: 2, limit: 10 },
        'SUPER_USER',
      );

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(prismaService.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });
});
