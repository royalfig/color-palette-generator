import { useState, useEffect } from 'react';

type Color = {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  lab: { l: number; a: number; b: number };
  luminance: number;
  luminanceWCAG: number;
  requestedHex: string;
  distance: number;
};

interface IUseFetchWithAbortResponse {
  fetchedData: { colorNames: string[]; paletteTitle: string } | null;
  isLoading: boolean;
  error: Error | null;
}

export function useFetchColorNames(data: string | string[]): IUseFetchWithAbortResponse {
  const [fetchedData, setFetchedData] = useState<{ colorNames: string[]; paletteTitle: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const controller = new AbortController();
  const signal = controller.signal;

  useEffect(() => {
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
        setError(e instanceof Error ? e : new Error('An unexpected error occurred'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchColorName(data);

    return () => {
      controller.abort();
    };
  }, [data]);

  return { fetchedData, isLoading, error };
}
