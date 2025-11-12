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
        // ApiError can be a simple object with message and status, or an Error instance
        let apiError: ApiError;

        if (err && typeof err === 'object' && 'message' in err) {
          // It's an ApiError (object with message)
          apiError = err as ApiError;
        } else if (err instanceof Error) {
          // It's an Error instance
          apiError = {
            message: err.message || 'Erro desconhecido',
          };
        } else {
          // Unknown error
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
    <T>(
      endpoint: string,
      dataOrOptions?: unknown | UseApiOptions<T>,
      options?: UseApiOptions<T>,
    ) => {
      // Handle both signatures: del(endpoint, options) and del(endpoint, data, options)
      let body: unknown | undefined;
      let opts: UseApiOptions<T> | undefined;

      if (
        dataOrOptions &&
        typeof dataOrOptions === 'object' &&
        !('onSuccess' in dataOrOptions) &&
        !('onError' in dataOrOptions)
      ) {
        // It's data (body)
        body = dataOrOptions;
        opts = options;
      } else {
        // It's options
        opts = dataOrOptions as UseApiOptions<T> | undefined;
      }

      return request<T>((client) => client.delete<T>(endpoint, body), opts);
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
