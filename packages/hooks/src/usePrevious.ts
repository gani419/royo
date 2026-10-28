import { useEffect, useRef } from 'react';

/**
 * Tracks the previous value of a state or prop.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

