import { useEffect, useState } from 'react';

/* Simple Hook for caching & retrieved data */
export const useCachedState = (key:string, initialValue:any) => {
  const genKey = key;
  
  const [storedValue, setStoredValue] = useState(
    () => {
      try {
        const item = window.localStorage.getItem(genKey);
        /* Parse stored json or if none, return initialValue */
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        // If error also return initialValue and handle error - needs work
        return initialValue;
      }
    }
  );
  
  const setValue = (value:any) => {
    try {
      // For same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(genKey, JSON.stringify(valueToStore));
    } catch (error) {
      // TODO: handle the error cases needs work
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
};

export const useDebounce = (value:any, delay:number) => {
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
