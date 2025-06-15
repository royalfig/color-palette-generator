import { useState, useEffect, useRef } from 'react'
import { BaseColorData } from '../util/factory'

// Your type definitions remain the same

interface IUseFetchWithAbortResponse {
  fetchedData: { colorNames: string[]; paletteTitle: string } | null
  isLoading: boolean
  error: Error | null
}

function prepareColorData(palette: BaseColorData[]) {
  return palette.map(color => color.conversions.hex.value.replace('#', '')).join(',')
}

export function useFetchColorNames(palette: BaseColorData[]): IUseFetchWithAbortResponse {
  const [fetchedData, setFetchedData] = useState<{ colorNames: string[]; paletteTitle: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const data = prepareColorData(palette)

  useEffect(() => {
    setIsLoading(true)
    setFetchedData(null)
    setError(null)

    const controller = new AbortController()
    const signal = controller.signal

    async function fetchColorName() {
      try {
        const res = await fetch(`https://api.colorpalette.pro/palette/${data}`, { signal })
        const { colors, palette_name } = (await res.json()) as { colors: any; palette_name: string }
        const colorNames = colors.map((c: any) => c.name)
        setFetchedData({ colorNames, paletteTitle: palette_name })
      } catch (e) {
        if (!signal.aborted) {
          setError(e instanceof Error ? e : new Error('An unexpected error occurred'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchColorName()

    return () => controller.abort()
  }, [data])

  return { fetchedData, isLoading, error }
}
