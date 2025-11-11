import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTestingModule } from './test-utils';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const { get } = await createTestingModule([AppService], [AppController]);
    controller = get<AppController>(AppController);
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
});
