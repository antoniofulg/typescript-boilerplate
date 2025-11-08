import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTestingModule } from './test-utils';
import { faker } from '@faker-js/faker';

describe('AppController', () => {
  let controller: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const { get } = await createTestingModule([AppService], [AppController]);
    controller = get<AppController>(AppController);
    appService = get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const result = controller.getHello();
      expect(result).toBe('Hello World!');
    });
  });

  describe('getTenants', () => {
    it('should return an array of tenants', async () => {
      const mockTenants = [
        {
          id: faker.string.uuid(),
          name: faker.company.name(),
          slug: faker.lorem.slug(),
          status: 'ACTIVE' as const,
          createdAt: new Date(),
        },
      ];

      const getTenantsSpy = jest
        .spyOn(appService, 'getTenants')
        .mockResolvedValue(mockTenants);

      const result = await controller.getTenants();

      expect(result).toEqual(mockTenants);
      expect(getTenantsSpy).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(appService, 'getTenants').mockRejectedValue(error);

      await expect(controller.getTenants()).rejects.toThrow('Service error');
    });
  });
});
