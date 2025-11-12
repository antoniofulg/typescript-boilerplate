import { Test, TestingModule } from '@nestjs/testing';
import { Type, Provider } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common/interfaces';
import { PrismaService } from './prisma/prisma.service';
import { Mock, vi } from 'vitest';

/**
 * Type for mock PrismaService
 */
export type MockPrismaService = {
  tenant: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  user: {
    findMany: Mock;
    findFirst: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  superAdmin: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  session: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  project: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  attendance: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  vote: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  log: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
  };
  $connect: Mock;
  $disconnect: Mock;
  $transaction: Mock;
};

/**
 * Creates a mock PrismaService for testing
 */
export function createMockPrismaService(): MockPrismaService {
  return {
    tenant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    superAdmin: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    session: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    vote: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    log: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
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
  providers: (Provider | Type)[],
  controllers: Type[] = [],
  imports: (Type | DynamicModule | Promise<DynamicModule>)[] = [],
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
