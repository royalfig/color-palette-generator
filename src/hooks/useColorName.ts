import { useState, useEffect, useRef } from 'react';

// Your type definitions remain the same

export function useFetchColorNames(data: string | string[]): IUseFetchWithAbortResponse {
  const [fetchedData, setFetchedData] = useState<{ colorNames: string[]; paletteTitle: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use a ref for the AbortController to have a stable reference
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Initialize the AbortController only when needed
    if (!fetchControllerRef.current) {
      fetchControllerRef.current = new AbortController();
    }
    const signal = fetchControllerRef.current.signal;

    async function fetchColorName(data: string | string[]) {
      if (typeof data === 'string') {
        data = [data];
      }

      const colorStr = data.map((color: string) => color.replace('#', '')).join(',');

      try {
        const res = await fetch(`https://api.color.pizza/v1/?values=${colorStr}`, { signal });
        const { colors, paletteTitle } = (await res.json()) as { colors: Color[]; paletteTitle: string };
        const colorNames = colors.map((c: Color) => c.name);
        setFetchedData({ colorNames, paletteTitle });
      } catch (e) {
        if (!signal.aborted) {
          // Only update error state if the fetch wasn't aborted
          setError(e instanceof Error ? e : new Error('An unexpected error occurred'));
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchColorName(data);

    return () => {
      // Cancel the fetch request on cleanup
      fetchControllerRef.current?.abort();
      // Reset the AbortController for the next use
      fetchControllerRef.current = new AbortController();
    };
  }, [data]);

  return { fetchedData, isLoading, error };
}
