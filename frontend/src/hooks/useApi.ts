import React, { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specialized hook for form submissions
export function useFormSubmit<T = any>(options: UseApiOptions = {}) {
  const { execute, loading, error, reset } = useApi<T>(options);
  
  const submit = useCallback(async (apiCall: () => Promise<T>) => {
    try {
      return await execute(apiCall);
    } catch (error) {
      // Error is already handled by useApi
      return null;
    }
  }, [execute]);

  return {
    submit,
    loading,
    error,
    reset,
  };
}

// Hook for data fetching with automatic loading states
export function useFetch<T = any>(
  apiCall: (() => Promise<T>) | null,
  dependencies: any[] = []
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!apiCall) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch data';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [apiCall]);

  // Auto-fetch on mount and dependency changes
  React.useEffect(() => {
    fetch();
  }, dependencies);

  const refetch = useCallback(() => {
    return fetch();
  }, [fetch]);

  return {
    ...state,
    refetch,
  };
}

export default useApi;