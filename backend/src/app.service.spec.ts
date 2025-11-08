import { AppService } from './app.service';
import { createTestingModule } from './test-utils';
import { faker } from '@faker-js/faker';

describe('AppService', () => {
  let service: AppService;
  let mockPrismaService: import('./test-utils').MockPrismaService;

  beforeEach(async () => {
    const { mockPrismaService: mockPrisma, get } = await createTestingModule([
      AppService,
    ]);
    service = get<AppService>(AppService);
    mockPrismaService = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(service.getHello()).toBe('Hello World!');
    });
  });

  describe('getTenants', () => {
    it('should return an array of tenants', async () => {
      const mockTenants = [
        {
          id: faker.string.uuid(),
          name: faker.company.name(),
          slug: faker.lorem.slug(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: faker.string.uuid(),
          name: faker.company.name(),
          slug: faker.lorem.slug(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);

      const result = await service.getTenants();

      expect(result).toEqual(mockTenants);
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return an empty array when no tenants exist', async () => {
      mockPrismaService.tenant.findMany.mockResolvedValue([]);

      const result = await service.getTenants();

      expect(result).toEqual([]);
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockPrismaService.tenant.findMany.mockRejectedValue(error);

      await expect(service.getTenants()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
