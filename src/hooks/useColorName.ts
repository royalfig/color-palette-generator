import { useState, useEffect, useRef, useMemo } from 'react'
import { BaseColorData } from '../util/factory'

// Your type definitions remain the same

interface IUseFetchWithAbortResponse {
  fetchedData: { colorNames: string[]; paletteTitle: string; baseColorName: string } | null
  isLoading: boolean
  error: Error | null
}

function prepareColorData(palette: BaseColorData[]) {
  const baseIdx = palette.findIndex(color => color.isBase)
  return { formattedPalette: palette.map(color => color.conversions.hex.value.replace('#', '')).join(','), baseIdx }
}

export function useFetchColorNames(palette: BaseColorData[]): IUseFetchWithAbortResponse {
  const [fetchedData, setFetchedData] = useState<{
    colorNames: string[]
    paletteTitle: string
    baseColorName: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { formattedPalette, baseIdx } = useMemo(() => prepareColorData(palette), [palette])

  useEffect(() => {
    console.log('fetch effect running', formattedPalette, baseIdx)
    setIsLoading(true)
    setFetchedData(null)
    setError(null)

    const controller = new AbortController()
    const signal = controller.signal

    async function fetchColorName() {
      try {
        const res = await fetch(`https://api.colorpalette.pro/palette/${formattedPalette}`, { signal })
        const { colors, palette_name } = (await res.json()) as { colors: any; palette_name: string }
        const colorNames = colors.map((c: any) => c.name)
        setFetchedData({ colorNames, paletteTitle: palette_name, baseColorName: colorNames[baseIdx] })
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
  }, [palette])

  return { fetchedData, isLoading, error }
}
