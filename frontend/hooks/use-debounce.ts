'use client';

import { useState, useEffect } from 'react';

/**
 * Returns a debounced value that only updates after the specified delay.
 * Useful for search inputs to reduce API calls.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
