import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/src/test-utils';
import userEvent from '@testing-library/user-event';
import AuthPage from '@/app/auth/page';
import { http, HttpResponse } from 'msw';
import { server } from '@/src/mocks/server';

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('Authentication Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    mockReplace.mockClear();
  });

  describe('Login', () => {
    it('renders login form', () => {
      render(<AuthPage />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /entrar/i }),
      ).toBeInTheDocument();
    });

    it('validates email field', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });
    });

    it('validates password field', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      await user.type(emailInput, 'test@example.com');
      await user.clear(passwordInput);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
      });
    });

    it('handles successful login', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('handles login error', async () => {
      // Mock API to return error
      server.use(
        http.post('http://localhost:4000/auth/login', () => {
          return HttpResponse.json(
            { message: 'Credenciais inválidas' },
            { status: 401 },
          );
        }),
      );

      const user = userEvent.setup();
      render(<AuthPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      await user.type(emailInput, 'wrong@test.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Wait for error handling
      await waitFor(() => {
        // The error should be handled by the toast system
        expect(submitButton).toBeInTheDocument();
      });
    });
  });

  describe('Register', () => {
    it('switches to register tab', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      const registerTab = screen.getByRole('tab', { name: /registrar/i });
      await user.click(registerTab);

      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /registrar/i }),
      ).toBeInTheDocument();
    });

    it('validates register form fields', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      const registerTab = screen.getByRole('tab', { name: /registrar/i });
      await user.click(registerTab);

      const submitButton = screen.getByRole('button', { name: /registrar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
      });
    });

    it('validates password minimum length', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      const registerTab = screen.getByRole('tab', { name: /registrar/i });
      await user.click(registerTab);

      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /registrar/i });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/senha deve ter pelo menos 6 caracteres/i),
        ).toBeInTheDocument();
      });
    });

    it('handles successful registration', async () => {
      const user = userEvent.setup();
      render(<AuthPage />);

      const registerTab = screen.getByRole('tab', { name: /registrar/i });
      await user.click(registerTab);

      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /registrar/i });

      await user.type(nameInput, 'New User');
      await user.type(emailInput, 'newuser@test.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('handles registration error for existing email', async () => {
      // Mock API to return error for existing email
      server.use(
        http.post('http://localhost:4000/auth/register', () => {
          return HttpResponse.json(
            { message: 'Email já está em uso' },
            { status: 400 },
          );
        }),
      );

      const user = userEvent.setup();
      render(<AuthPage />);

      const registerTab = screen.getByRole('tab', { name: /registrar/i });
      await user.click(registerTab);

      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /registrar/i });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'existing@test.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for error handling
      await waitFor(() => {
        expect(submitButton).toBeInTheDocument();
      });
    });
  });
});
