import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has been stable for `delay` ms.
 * Used by useSearch to avoid hitting /api/search on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
