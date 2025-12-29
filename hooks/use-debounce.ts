import { useEffect, useState, useRef } from "react";

export function useDebounce<T>(
  value: T,
  delay: number = 300,
  options?: { maxWait?: number },
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCallTimeRef = useRef<number>(0);

  useEffect(() => {
    if (lastCallTimeRef.current === 0) {
      lastCallTimeRef.current = Date.now();
    }

    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const maxWait = options?.maxWait;

    // Clear any existing maxWait timeout
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = undefined;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      lastCallTimeRef.current = Date.now();
    }, delay);

    // Set maxWait timeout if specified and not already triggered
    if (maxWait && timeSinceLastCall < maxWait) {
      const remainingWaitTime = maxWait - timeSinceLastCall;
      maxWaitTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastCallTimeRef.current = Date.now();
        clearTimeout(handler);
      }, remainingWaitTime);
    }

    return () => {
      clearTimeout(handler);
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }
    };
  }, [value, delay, options?.maxWait]);

  return debouncedValue;
}
