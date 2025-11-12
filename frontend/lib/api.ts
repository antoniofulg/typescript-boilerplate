const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export type ApiError = {
  message: string;
  status?: number;
};

/**
 * Extracts error message from a NestJS HTTP response
 */
async function extractErrorMessage(response: Response): Promise<string> {
  // Default messages based on HTTP status
  const statusMessages: Record<number, string> = {
    400: 'Requisição inválida',
    401: 'Não autenticado',
    403: 'Acesso negado',
    404: 'Recurso não encontrado',
    409: 'Conflito: o recurso já existe',
    422: 'Erro de validação',
    500: 'Erro interno do servidor',
  };

  let errorMessage =
    statusMessages[response.status] || `Erro ${response.status}`;

  try {
    // Clone response to read body without consuming the original
    const clonedResponse = response.clone();
    const contentType = clonedResponse.headers.get('content-type');

    // Only try to parse if it's JSON
    if (contentType && contentType.includes('application/json')) {
      const errorData = await clonedResponse.json();

      // NestJS error format: { statusCode, message, error }
      if (errorData.message) {
        // If message is an array (validation errors), join the messages
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(', ');
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }
      } else if (errorData.error && typeof errorData.error === 'string') {
        // Fallback to error field
        errorMessage = errorData.error;
      }
    }
  } catch {
    // If unable to parse JSON, use default message based on status
    // This is already defined above as fallback
  }

  return errorMessage;
}

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
            const errorMessage = await extractErrorMessage(retryResponse);
            const error: ApiError = {
              message: errorMessage,
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
      const errorMessage = await extractErrorMessage(response);
      const error: ApiError = {
        message: errorMessage,
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

  async delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
