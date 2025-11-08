# 🧪 Testing Guide

This project uses **Vitest**, **React Testing Library**, and **MSW** for unit testing.

## 📦 Testing Stack

- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Custom DOM matchers
- **@testing-library/user-event** - User interaction simulation
- **MSW (Mock Service Worker)** - API mocking for tests
- **@vitest/ui** - Visual test runner interface
- **@vitest/coverage-v8** - Code coverage reports

## 🚀 Running Tests

### Using Make Commands (Recommended)

The easiest way to run tests is using the Make commands from the project root:

```bash
# Run tests once (CI mode)
make test-frontend

# Run tests in watch mode (development)
make test-frontend-watch

# Open visual test UI in browser
make test-frontend-ui

# Run tests with coverage report
make test-frontend-coverage
```

### Using NPM Commands (Alternative)

You can also run tests directly from the `frontend/` directory:

#### Watch Mode (Development)

```bash
cd frontend
npm test
# or
npm run test
```

This runs tests in watch mode, automatically re-running when files change.

#### UI Mode (Visual Test Runner)

```bash
cd frontend
npm run test:ui
```

Opens a visual interface in the browser to run and debug tests.

#### Single Run (CI/CD)

```bash
cd frontend
npm run test:run
```

Runs all tests once and exits (useful for CI/CD pipelines).

#### Coverage Report

```bash
cd frontend
npm run test:coverage
```

Generates a code coverage report in the `coverage/` directory.

## 📁 Test Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       ├── button.test.tsx
│   │       ├── language-toggle.test.tsx
│   │       └── theme-toggle.test.tsx
│   ├── app/
│   │   └── __tests__/
│   │       └── page.test.tsx
│   ├── mocks/
│   │   ├── server.ts          # MSW server setup
│   │   └── handlers.ts        # API mock handlers
│   └── test-utils.tsx         # Custom render with providers
├── vitest.config.ts           # Vitest configuration
└── vitest.setup.ts            # Test setup file
```

## 🧩 Writing Tests

### Basic Component Test

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/src/test-utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i }),
    ).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```tsx
import userEvent from '@testing-library/user-event';

it('handles click events', async () => {
  const handleClick = vi.fn();
  const user = userEvent.setup();

  render(<Button onClick={handleClick}>Click me</Button>);
  const button = screen.getByRole('button', { name: /click me/i });

  await user.click(button);
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing with API Mocks (MSW)

MSW automatically mocks API calls defined in `src/mocks/handlers.ts`:

```tsx
it('fetches and displays tenants', async () => {
  render(<Home />);

  await waitFor(() => {
    expect(screen.getByText(/tenant 1/i)).toBeInTheDocument();
  });
});
```

### Testing with Translations (next-intl)

The `test-utils.tsx` automatically provides translations:

```tsx
import { render, screen } from '@/src/test-utils';

it('displays translated text', () => {
  render(<MyComponent />);
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

## 🔧 Configuration

### Vitest Config (`vitest.config.ts`)

- Environment: `jsdom` (for DOM testing)
- Setup file: `vitest.setup.ts`
- Path aliases: `@/*` mapped to project root
- Coverage: V8 provider with HTML, JSON, and text reports

### Test Setup (`vitest.setup.ts`)

- Imports `@testing-library/jest-dom` for custom matchers
- Configures MSW server lifecycle
- Cleans up after each test

### Custom Test Utils (`src/test-utils.tsx`)

Provides a custom `render` function that includes:

- `NextIntlClientProvider` (for translations)
- `ThemeProvider` (for theme context)

## 📝 Best Practices

1. **Test user behavior, not implementation**
   - Use `getByRole`, `getByLabelText`, etc.
   - Avoid testing internal state

2. **Keep tests isolated**
   - Each test should be independent
   - Use `beforeEach`/`afterEach` for setup/cleanup

3. **Use MSW for API mocking**
   - Define handlers in `src/mocks/handlers.ts`
   - Don't mock `fetch` directly

4. **Test accessibility**
   - Use semantic queries (`getByRole`, `getByLabelText`)
   - Test keyboard navigation

5. **Write descriptive test names**
   - Use `it('should...')` or `it('renders...')`
   - Group related tests with `describe`

## 🎯 Example Test Scenarios

### Component Rendering

```tsx
it('renders component with required props', () => {
  render(<Component title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### User Interactions

```tsx
it('updates input value on change', async () => {
  const user = userEvent.setup();
  render(<Input />);
  const input = screen.getByRole('textbox');

  await user.type(input, 'Hello');
  expect(input).toHaveValue('Hello');
});
```

### API Integration

```tsx
it('displays data from API', async () => {
  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText(/data from api/i)).toBeInTheDocument();
  });
});
```

### Error States

```tsx
it('displays error message on API failure', async () => {
  server.use(
    http.get('/api/data', () => {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }),
  );

  render(<DataComponent />);
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
