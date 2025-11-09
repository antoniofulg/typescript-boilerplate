const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export type ApiError = {
  message: string;
  status?: number;
};

/**
 * Extrai a mensagem de erro de uma resposta HTTP do NestJS
 */
async function extractErrorMessage(response: Response): Promise<string> {
  // Mensagens padrão baseadas no status HTTP
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
    // Clonar a resposta para poder ler o body sem consumir o original
    const clonedResponse = response.clone();
    const contentType = clonedResponse.headers.get('content-type');

    // Só tentar parsear se for JSON
    if (contentType && contentType.includes('application/json')) {
      const errorData = await clonedResponse.json();

      // NestJS error format: { statusCode, message, error }
      if (errorData.message) {
        // Se message é um array (erros de validação), juntar as mensagens
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(', ');
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }
      } else if (errorData.error && typeof errorData.error === 'string') {
        // Fallback para o campo error
        errorMessage = errorData.error;
      }
    }
  } catch {
    // Se não conseguir parsear JSON, usar mensagem padrão baseada no status
    // Isso já está definido acima como fallback
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

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
