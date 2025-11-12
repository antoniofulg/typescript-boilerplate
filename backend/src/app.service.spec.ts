import { AppService } from './app.service';
import { createTestingModule } from './test-utils';
import { vi } from 'vitest';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const { get } = await createTestingModule([AppService]);
    service = get<AppService>(AppService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(service.getHello()).toBe('Hello World!');
    });
  });
});
