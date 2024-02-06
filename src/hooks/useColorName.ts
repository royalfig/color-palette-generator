import { useState, useEffect, useRef } from 'react'
import { Schemes } from '../util/palettes'

// Your type definitions remain the same

interface IUseFetchWithAbortResponse {
  fetchedData: { colorNames: string[]; paletteTitle: string } | null
  isLoading: boolean
  error: Error | null
}

function prepareColorData(palettes: Schemes, palette: string, variation: string) {
  return palettes[palette][variation].map(color => color.hex.string.replace('#', '')).join(',')
}

export function useFetchColorNames(
  palettes: Schemes,
  palette: string,
  variation: string,
): IUseFetchWithAbortResponse {
  const [fetchedData, setFetchedData] = useState<{ colorNames: string[]; paletteTitle: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const data = prepareColorData(palettes, palette, variation)

  // Use a ref for the AbortController to have a stable reference
  const fetchControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Initialize the AbortController only when needed
    if (!fetchControllerRef.current) {
      fetchControllerRef.current = new AbortController()
    }

    const signal = fetchControllerRef.current.signal

    async function fetchColorName(data: string) {
      

      try {
        const res = await fetch(`https://api.color.pizza/v1/?values=${data}`, { signal })
        const { colors, paletteTitle } = (await res.json()) as { colors: any; paletteTitle: string }
        const colorNames = colors.map((c: any) => c.name)
        setFetchedData({ colorNames, paletteTitle })
      } catch (e) {
        if (!signal.aborted) {
          // Only update error state if the fetch wasn't aborted
          setError(e instanceof Error ? e : new Error('An unexpected error occurred'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchColorName(data)

    return () => {
      // Cancel the fetch request on cleanup
      fetchControllerRef.current?.abort()
      // Reset the AbortController for the next use
      fetchControllerRef.current = new AbortController()
    }
  }, [palette, variation, palettes[palette][variation][0].hex.string])

  return { fetchedData, isLoading, error }
}
