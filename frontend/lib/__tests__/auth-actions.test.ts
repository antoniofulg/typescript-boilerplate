import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logoutAction } from '../auth-actions';

// Mock next/headers
const mockCookies = vi.fn();
vi.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}));

describe('logoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should return success when no token exists', async () => {
    // Mock cookies to return no token
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(mockCookieStore);

    const result = await logoutAction();

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should call logout endpoint and remove cookie on success', async () => {
    const mockToken = 'test-token-123';
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(mockCookieStore);

    // Mock successful response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Logout realizado com sucesso' }),
    });

    const result = await logoutAction();

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
    expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token', {
      path: '/',
    });
  });

  it('should remove cookie even if backend call fails', async () => {
    const mockToken = 'test-token-123';
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(mockCookieStore);

    // Mock failed response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    const result = await logoutAction();

    // Should still return success since cookie is removed
    expect(result.success).toBe(true);
    expect(result.error).toBe('Internal server error');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token', {
      path: '/',
    });
  });

  it('should handle network errors gracefully', async () => {
    const mockToken = 'test-token-123';
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(mockCookieStore);

    // Mock network error
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    );

    const result = await logoutAction();

    // Should still return success and remove cookie
    expect(result.success).toBe(true);
    expect(result.error).toBe('Network error');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token', {
      path: '/',
    });
  });

  it('should handle JSON parse errors in error response', async () => {
    const mockToken = 'test-token-123';
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(mockCookieStore);

    // Mock response with invalid JSON
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const result = await logoutAction();

    expect(result.success).toBe(true);
    // When JSON parse fails, it falls back to default error message
    expect(result.error).toBe('Erro ao fazer logout');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token', {
      path: '/',
    });
  });

  it('should remove cookie even if cookie deletion fails', async () => {
    const mockToken = 'test-token-123';
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
      delete: vi.fn().mockImplementation(() => {
        throw new Error('Cookie deletion failed');
      }),
    };
    mockCookies.mockReturnValue(mockCookieStore);

    // Mock successful response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Logout realizado com sucesso' }),
    });

    // Should not throw, but handle gracefully
    const result = await logoutAction();

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });
});
