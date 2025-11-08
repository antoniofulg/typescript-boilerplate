# 🧪 Testing Guide

This project uses **Jest** and **@nestjs/testing** for unit and integration testing.

## 📦 Testing Stack

- **Jest** - JavaScript testing framework
- **@nestjs/testing** - NestJS testing utilities
- **ts-jest** - TypeScript preprocessor for Jest
- **@faker-js/faker** - Generate fake data for tests
- **supertest** - HTTP assertions for e2e tests

## 🚀 Running Tests

### Using Make Commands (Recommended)

The easiest way to run tests is using the Make commands from the project root:

```bash
# Run tests once (CI mode)
make test-backend

# Run tests in watch mode (development)
make test-backend-watch

# Run tests with coverage report
make test-backend-coverage

# Run e2e tests
make test-backend-e2e
```

### Using NPM Commands (Alternative)

You can also run tests directly from the `backend/` directory:

#### Watch Mode (Development)

```bash
cd backend
npm test
# or
npm run test:watch
```

This runs tests in watch mode, automatically re-running when files change.

#### Single Run (CI/CD)

```bash
cd backend
npm test
```

Runs all tests once and exits (useful for CI/CD pipelines).

#### Coverage Report

```bash
cd backend
npm run test:cov
```

Generates a code coverage report in the `coverage/` directory.

#### E2E Tests

```bash
cd backend
npm run test:e2e
```

Runs end-to-end tests that test the full application flow.

## 📁 Test Structure

```
backend/
├── src/
│   ├── app.controller.spec.ts
│   ├── app.service.spec.ts
│   ├── prisma/
│   │   └── prisma.service.spec.ts
│   └── test-utils.ts          # Test utilities and helpers
├── test/
│   ├── app.e2e-spec.ts        # E2E tests
│   └── jest-e2e.json          # E2E Jest configuration
├── tsconfig.spec.json          # TypeScript config for tests
└── package.json                # Jest configuration
```

## 🧩 Writing Tests

### Basic Service Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { createTestingModule } from './test-utils';

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

  it('should return "Hello World!"', () => {
    expect(service.getHello()).toBe('Hello World!');
  });
});
```

### Testing with Prisma Mocks

The `test-utils.ts` provides a mock PrismaService:

```typescript
import { createTestingModule } from './test-utils';
import { faker } from '@faker-js/faker';

describe('AppService', () => {
  it('should return tenants', async () => {
    const mockTenants = [
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
    expect(mockPrismaService.tenant.findMany).toHaveBeenCalled();
  });
});
```

### Testing Controllers

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTestingModule } from './test-utils';

describe('AppController', () => {
  let controller: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const { get } = await createTestingModule([AppService], [AppController]);
    controller = get<AppController>(AppController);
    appService = get<AppService>(AppService);
  });

  it('should return tenants', async () => {
    const mockTenants = [
      /* ... */
    ];
    jest.spyOn(appService, 'getTenants').mockResolvedValue(mockTenants);

    const result = await controller.getTenants();

    expect(result).toEqual(mockTenants);
    expect(appService.getTenants).toHaveBeenCalled();
  });
});
```

### E2E Tests

E2E tests test the full application flow:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
```

## 🔧 Configuration

### Jest Config (`package.json`)

- Test files: `*.spec.ts` in `src/` directory
- Coverage: Excludes spec files, interfaces, DTOs, main.ts, and modules
- Reports: text, json, html, lcov
- Environment: Node.js

### Test Utils (`src/test-utils.ts`)

Provides utilities for creating test modules:

- `createMockPrismaService()` - Creates a mock PrismaService
- `createTestingModule()` - Creates a testing module with mocked PrismaService

### TypeScript Config (`tsconfig.spec.json`)

- Extends main `tsconfig.json`
- Uses `commonjs` module system for Jest compatibility
- Includes only `*.spec.ts` files

## 📝 Best Practices

1. **Test behavior, not implementation**
   - Test what the code does, not how it does it
   - Focus on public APIs

2. **Use mocks for external dependencies**
   - Mock PrismaService for database operations
   - Mock external services and APIs

3. **Keep tests isolated**
   - Each test should be independent
   - Use `beforeEach`/`afterEach` for setup/cleanup
   - Clear mocks between tests

4. **Use descriptive test names**
   - Use `it('should...')` format
   - Group related tests with `describe`

5. **Test error cases**
   - Test error handling
   - Test edge cases
   - Test validation

6. **Use faker for test data**
   - Generate realistic test data
   - Avoid hardcoded values

## 🎯 Example Test Scenarios

### Service Method

```typescript
it('should return all tenants ordered by creation date', async () => {
  const mockTenants = [
    { id: '1', name: 'Tenant 1', createdAt: new Date('2024-01-01') },
    { id: '2', name: 'Tenant 2', createdAt: new Date('2024-01-02') },
  ];

  mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);

  const result = await service.getTenants();

  expect(result).toEqual(mockTenants);
  expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith({
    orderBy: { createdAt: 'desc' },
  });
});
```

### Error Handling

```typescript
it('should handle database errors', async () => {
  const error = new Error('Database connection failed');
  mockPrismaService.tenant.findMany.mockRejectedValue(error);

  await expect(service.getTenants()).rejects.toThrow(
    'Database connection failed',
  );
});
```

### Controller with Service Mock

```typescript
it('should return tenants from service', async () => {
  const mockTenants = [
    /* ... */
  ];
  jest.spyOn(appService, 'getTenants').mockResolvedValue(mockTenants);

  const result = await controller.getTenants();

  expect(result).toEqual(mockTenants);
  expect(appService.getTenants).toHaveBeenCalled();
});
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Faker.js Documentation](https://fakerjs.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
