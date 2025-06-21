import { useState, useEffect, useCallback } from 'react';
import { AxiosResponse, AxiosError } from 'axios';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: AxiosError) => void;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Hook personalizado para manejar llamadas a la API
 */
export const useApi = <T = any>(
  apiFunction: (...args: any[]) => Promise<AxiosResponse<T>>,
  options: UseApiOptions = {}
): UseApiState<T> => {
  const { immediate = false, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | undefined> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction(...args);
      const responseData = response.data;
      
      setData(responseData);
      
      if (onSuccess) {
        onSuccess(responseData);
      }
      
      return responseData;
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorMessage = 
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Error desconocido';
      
      setError(errorMessage);
      
      if (onError) {
        onError(axiosError);
      }
      
      console.error('API Error:', axiosError);
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  // Ejecutar inmediatamente si immediate = true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * Hook para manejar múltiples llamadas a la API
 */
export const useMultipleApi = <T extends Record<string, any>>(
  apiCalls: Record<keyof T, () => Promise<AxiosResponse<T[keyof T]>>>,
  options: UseApiOptions = {}
) => {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const execute = useCallback(async (): Promise<Partial<T> | undefined> => {
    try {
      setLoading(true);
      setErrors({});
      
      const promises = Object.entries(apiCalls).map(async ([key, apiCall]) => {
        try {
          const response = await (apiCall as () => Promise<AxiosResponse>)();
          return { key, data: response.data, error: null };
        } catch (err) {
          const axiosError = err as AxiosError;
          const errorMessage = 
            axiosError.response?.data?.message ||
            axiosError.message ||
            'Error desconocido';
          return { key, data: null, error: errorMessage };
        }
      });

      const results = await Promise.all(promises);
      
      const newData: Partial<T> = {};
      const newErrors: Record<string, string> = {};
      
      results.forEach(({ key, data, error }) => {
        if (error) {
          newErrors[key] = error;
        } else {
          newData[key as keyof T] = data;
        }
      });
      
      setData(newData);
      setErrors(newErrors);
      
      if (options.onSuccess && Object.keys(newErrors).length === 0) {
        options.onSuccess(newData);
      }
      
      return newData;
    } catch (err) {
      console.error('Multiple API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCalls, options]);

  return {
    data,
    loading,
    errors,
    execute,
    hasErrors: Object.keys(errors).length > 0,
  };
};

/**
 * Hook para paginación de API
 */
interface UsePaginatedApiOptions extends UseApiOptions {
  pageSize?: number;
  initialPage?: number;
}

export const usePaginatedApi = <T = any>(
  apiFunction: (page: number, pageSize: number, ...args: any[]) => Promise<AxiosResponse<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
  }>>,
  options: UsePaginatedApiOptions = {}
) => {
  const { pageSize = 10, initialPage = 1, ...restOptions } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  const {
    data: response,
    loading,
    error,
    execute: baseExecute,
    reset
  } = useApi(
    (page: number, size: number, ...args: any[]) => apiFunction(page, size, ...args),
    {
      ...restOptions,
      onSuccess: (data) => {
        setTotalPages(Math.ceil(data.total / data.pageSize));
        setTotalItems(data.total);
        if (restOptions.onSuccess) {
          restOptions.onSuccess(data);
        }
      }
    }
  );

  const execute = useCallback((...args: any[]) => {
    return baseExecute(currentPage, pageSize, ...args);
  }, [baseExecute, currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Ejecutar cuando cambie la página
  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, [currentPage, execute, options.immediate]);

  return {
    data: response?.data || [],
    loading,
    error,
    execute,
    reset,
    // Pagination
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * Hook para auto-refresh de datos
 */
export const useAutoRefresh = <T = any>(
  apiFunction: () => Promise<AxiosResponse<T>>,
  interval: number = 30000, // 30 segundos por defecto
  options: UseApiOptions = {}
) => {
  const { data, loading, error, execute, reset } = useApi(apiFunction, {
    immediate: true,
    ...options
  });

  // Setup auto-refresh
  useEffect(() => {
    if (interval <= 0) return;

    const intervalId = setInterval(() => {
      if (!loading) {
        execute();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [execute, interval, loading]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    refreshInterval: interval,
  };
};