import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

type MockPrismaClient = {
  $connect: jest.Mock<Promise<void>>;
  $disconnect: jest.Mock<Promise<void>>;
};

describe('PrismaService', () => {
  let service: PrismaService;
  let mockPrismaClient: MockPrismaClient;

  beforeEach(async () => {
    const $connectMock = jest
      .fn<Promise<void>, []>()
      .mockResolvedValue(undefined);
    const $disconnectMock = jest
      .fn<Promise<void>, []>()
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
            onModuleInit: jest.fn().mockImplementation(async () => {
              await mockPrismaClient.$connect();
            }),
            onModuleDestroy: jest.fn().mockImplementation(async () => {
              await mockPrismaClient.$disconnect();
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
