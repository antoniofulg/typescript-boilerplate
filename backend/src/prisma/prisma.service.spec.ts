import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { vi, Mock } from 'vitest';

type MockPrismaClient = {
  $connect: Mock<[], Promise<void>>;
  $disconnect: Mock<[], Promise<void>>;
};

describe('PrismaService', () => {
  let service: PrismaService;
  let mockPrismaClient: MockPrismaClient;

  beforeEach(async () => {
    const $connectMock = vi
      .fn<[], Promise<void>>()
      .mockResolvedValue(undefined);
    const $disconnectMock = vi
      .fn<[], Promise<void>>()
      .mockResolvedValue(undefined);

    mockPrismaClient = {
      $connect: $connectMock,
      $disconnect: $disconnectMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            ...mockPrismaClient,
            onModuleInit: vi.fn().mockImplementation(async () => {
              await mockPrismaClient.$connect();
            }),
            onModuleDestroy: vi.fn().mockImplementation(async () => {
              await mockPrismaClient.$disconnect();
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to database', async () => {
      await service.onModuleInit();
      expect(mockPrismaClient.$connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database', async () => {
      await service.onModuleDestroy();
      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
    });
  });
});
