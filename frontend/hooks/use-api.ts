import { useState, useCallback, useMemo } from 'react';
import { ApiClient, ApiError } from '@/lib/api';

type UseApiOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
};

export function useApi(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const api = useMemo(() => new ApiClient(token), [token]);

  const request = useCallback(
    async <T>(
      fn: (client: ApiClient) => Promise<T>,
      options?: UseApiOptions<T>,
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const data = await fn(api);
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        // ApiError pode ser um objeto simples com message e status, ou uma instância de Error
        let apiError: ApiError;

        if (err && typeof err === 'object' && 'message' in err) {
          // É um ApiError (objeto com message)
          apiError = err as ApiError;
        } else if (err instanceof Error) {
          // É uma instância de Error
          apiError = {
            message: err.message || 'Erro desconhecido',
          };
        } else {
          // Erro desconhecido
          apiError = { message: 'Erro desconhecido' };
        }

        setError(apiError);
        options?.onError?.(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  const get = useCallback(
    <T>(endpoint: string, options?: UseApiOptions<T>) => {
      return request<T>((client) => client.get<T>(endpoint), options);
    },
    [request],
  );

  const post = useCallback(
    <T>(endpoint: string, data?: unknown, options?: UseApiOptions<T>) => {
      return request<T>((client) => client.post<T>(endpoint, data), options);
    },
    [request],
  );

  const patch = useCallback(
    <T>(endpoint: string, data?: unknown, options?: UseApiOptions<T>) => {
      return request<T>((client) => client.patch<T>(endpoint, data), options);
    },
    [request],
  );

  const del = useCallback(
    <T>(endpoint: string, options?: UseApiOptions<T>) => {
      return request<T>((client) => client.delete<T>(endpoint), options);
    },
    [request],
  );

  return {
    loading,
    error,
    get,
    post,
    patch,
    delete: del,
  };
}
