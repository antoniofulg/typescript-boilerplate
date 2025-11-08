import { Test, TestingModule } from '@nestjs/testing';
import { Type } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

/**
 * Type for mock PrismaService
 */
export type MockPrismaService = {
  tenant: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  user: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $transaction: jest.Mock;
};

/**
 * Creates a mock PrismaService for testing
 */
export function createMockPrismaService(): MockPrismaService {
  return {
    tenant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  };
}

/**
 * Return type for createTestingModule
 */
export type TestingModuleResult = {
  module: TestingModule;
  mockPrismaService: MockPrismaService;
  get: <T>(token: string | symbol | Type<T>) => T;
};

/**
 * Creates a testing module with mocked PrismaService
 */
export async function createTestingModule(
  providers: unknown[],
  controllers: unknown[] = [],
  imports: unknown[] = [],
): Promise<TestingModuleResult> {
  const mockPrismaService = createMockPrismaService();

  const module: TestingModule = await Test.createTestingModule({
    imports: imports as never[],
    controllers: controllers as never[],
    providers: [
      ...(providers as never[]),
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
    ],
  }).compile();

  return {
    module,
    mockPrismaService,
    get: <T>(token: string | symbol | Type<T>): T => module.get<T>(token),
  };
}
