import { AppService } from './app.service';
import { createTestingModule } from './test-utils';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const { get } = await createTestingModule([AppService]);
    service = get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(service.getHello()).toBe('Hello World!');
    });
  });
});
