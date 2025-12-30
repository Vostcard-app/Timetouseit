/**
 * useAsync Hook
 * Handles async operations with loading, error, and data states
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAsync(async () => {
 *   return await fetchData();
 * });
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (...args: unknown[]) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Hook for managing async operations
 */
export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const mountedRef = useRef(true);
  const lastPromiseRef = useRef<Promise<T> | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const promise = asyncFunction(...args);
      lastPromiseRef.current = promise;

      try {
        const data = await promise;

        // Only update state if component is still mounted and this is the latest promise
        if (mountedRef.current && lastPromiseRef.current === promise) {
          setState({
            data,
            loading: false,
            error: null,
          });
        }

        return data;
      } catch (error) {
        // Only update state if component is still mounted and this is the latest promise
        if (mountedRef.current && lastPromiseRef.current === promise) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
        throw error;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}

