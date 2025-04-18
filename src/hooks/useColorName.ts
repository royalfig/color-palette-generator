import { useState, useEffect, useRef } from 'react'
import { Palettes } from '../types'

// Your type definitions remain the same

interface IUseFetchWithAbortResponse {
  fetchedData: { colorNames: string[]; paletteTitle: string } | null
  isLoading: boolean
  error: Error | null
}

function prepareColorData(palettes: Palettes, palette: string, variation: string) {
  return palettes[palette][variation].map(color => color.hex.string.replace('#', '')).join(',')
}

export function useFetchColorNames(palettes: Palettes, palette: string, variation: string): IUseFetchWithAbortResponse {
  const [fetchedData, setFetchedData] = useState<{ colorNames: string[]; paletteTitle: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const data = prepareColorData(palettes, palette, variation)
  console.log('🚀 ~ data:', data)

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
        // const res2 = await fetch(`https://api.color.pizza/v1/?values=${data}`, { signal })
        // const x = (await res2.json()) as { colors: any; paletteTitle: string }
        const res = await fetch(`https://api.colorpalette.pro/palette/${data}`, { signal })
        const { colors, palette_name } = (await res.json()) as { colors: any; palette_name: string }
        const colorNames = colors.map((c: any) => c.name)
        setFetchedData({ colorNames, paletteTitle: palette_name })
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
