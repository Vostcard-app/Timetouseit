/**
 * useDebounce Hook
 * Debounces a value, updating it only after the specified delay
 * 
 * @example
 * ```tsx
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * ```
 */

import { useState, useEffect } from 'react';

/**
 * Hook for debouncing a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes (or component unmounts)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

