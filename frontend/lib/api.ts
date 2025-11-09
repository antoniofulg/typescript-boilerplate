const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export type ApiError = {
  message: string;
  status?: number;
};

export class ApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor(token?: string | null) {
    this.baseUrl = BACKEND_URL;
    this.token = token || null;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401 and haven't retried yet, try to refresh the token
    if (response.status === 401 && retryCount === 0 && this.token) {
      try {
        const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newToken = refreshData.accessToken;

          // Update token
          this.setToken(newToken);

          // Update in localStorage and cookie
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', newToken);
            document.cookie = `auth_token=${newToken}; path=/; max-age=604800; SameSite=Lax`;
          }

          // Dispatch event for AuthContext to update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('token-refreshed', {
                detail: { token: newToken },
              }),
            );
          }

          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            const error: ApiError = {
              message: errorData.message || `Erro ${retryResponse.status}`,
              status: retryResponse.status,
            };
            throw error;
          }

          return retryResponse.json();
        }
      } catch {
        // If refresh fails, continue to throw the original 401 error
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        message: errorData.message || `Erro ${response.status}`,
        status: response.status,
      };
      throw error;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
