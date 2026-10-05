import { useState, useEffect } from 'react';

/**
 * useDebounce hook to delay value updates by specified delay.
 *
 * @param {*} value
 * @param {number} [delay=500]
 * @returns {*} debouncedValue
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
