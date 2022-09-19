import { useCallback, useEffect, useState, useRef } from 'react';

/* Simple Hook for caching & retrieved data */
export const useCachedState = (key: string, initialValue: any, append?: string) => {

  const getValue = () => {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(_key);
        /* Parse stored json or if none, return initialValue */
        return item ? JSON.parse(item) : initialValue;
      }
    } catch (error) {
      // If error also return initialValue and handle error - needs work
      return initialValue;
    }
    return initialValue;
  };

  const _key =  append ? `${key}_${append}` : key ;
  const [storedValue, setStoredValue] = useState( () => getValue() );

  const setValue = useCallback(
    (value: any) => {
      try {
        if (typeof window !== 'undefined') {
          // For same API as useState
          const valueToStore = value instanceof Function ? value(storedValue) : value;
          setStoredValue(valueToStore);
          localStorage.setItem( _key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        // TODO: handle the error cases needs work
        // eslint-disable-next-line no-console
        console.log(error);
      }
    },
    [_key, storedValue]
  );

  const clearAll = () => typeof window !== 'undefined' && localStorage.clear();

  useEffect(() => {
    if (typeof window !== 'undefined') setValue(storedValue);
  }, [_key, setValue, storedValue]);

  return [storedValue, setValue, clearAll] as const;
};

/* Hook to debounce input */
export const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      /* Update debounced value after delay */
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      /* Cancel the timeout if value changes (also on delay change or unmount)
      This is how we prevent debounced value from updating if value is changed ...
      .. within the delay period. Timeout gets cleared and restarted. */
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] /* Only re-call effect if value or delay changes */
  );
  return debouncedValue;
};

// React hook for delaying calls with time
// returns callback to use for cancelling
export const useTimeout = (
  callback: () => void, // function to call. No args passed.
  // if you create a new callback each render, then previous callback will be cancelled on render.
  timeout: number = 0 // delay, ms (default: immediately put into JS Event Queue)
): (() => void) => {
  const timeoutIdRef = useRef<NodeJS.Timeout>();
  const cancel = useCallback(() => {
    const timeoutId = timeoutIdRef.current;
    if (timeoutId) {
      timeoutIdRef.current = undefined;
      clearTimeout(timeoutId);
    }
  }, [timeoutIdRef]);

  useEffect(() => {
    timeoutIdRef.current = setTimeout(callback, timeout);
    return cancel;
  }, [callback, timeout, cancel]);

  return cancel;
};

export const useWindowSize = () => {
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' && window.innerWidth);
  const [height, setHeight] = useState<number>(typeof window !== 'undefined' && window.innerHeight);

  if (typeof window !== 'undefined') {
    window.addEventListener(
      'resize',
      () => {
        setWidth(window.innerWidth);
        setHeight(window.innerHeight);
      },
      true
    );
  }
  return [height, width];
};

export const useCurrentRoute = () => {};
