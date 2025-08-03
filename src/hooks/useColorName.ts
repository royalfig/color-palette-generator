import { useState, useEffect, useRef, useMemo } from 'react'
import { BaseColorData } from '../util/factory'

// Your type definitions remain the same

interface IUseFetchWithAbortResponse {
  fetchedData: { colorNames: string[]; paletteTitle: string; baseColorName: string } | null
  isLoading: boolean
  error: Error | null
}

export function useFetchColorNames(palette: BaseColorData[], originalColor: BaseColorData): IUseFetchWithAbortResponse {
  const [fetchedData, setFetchedData] = useState<{
    colorNames: string[]
    paletteTitle: string
    baseColorName: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setFetchedData(null)
    setError(null)

    const controller = new AbortController()
    const signal = controller.signal

    async function fetchColorName() {
      try {
        const baseIndex = palette.findIndex(p => p.string === originalColor.string)
        if (baseIndex !== -1) {
          const paletteResponse = await fetch(
            `https://api.colorpalette.pro/palette/${palette
              .map(color => color.conversions.hex.value.replace('#', ''))
              .join(',')}`,
            { signal },
          )
          const { colors, palette_name } = (await paletteResponse.json()) as { colors: any; palette_name: string }
          const colorNames = colors.map((c: any) => c.name)
          const baseColorName = colorNames[baseIndex]

          setFetchedData({ colorNames, paletteTitle: palette_name, baseColorName })
          return
        }

        const paletteResponse = await fetch(
          `https://api.colorpalette.pro/palette/${palette
            .map(color => color.conversions.hex.value.replace('#', ''))
            .join(',')}`,
          { signal },
        )
        const colorResponse = await fetch(
          `https://api.colorpalette.pro/color/${originalColor.conversions.hex.value.replace('#', '')}`,
          { signal },
        )
        const { colors, palette_name } = (await paletteResponse.json()) as { colors: any; palette_name: string }
        const colorName = (await colorResponse.json()) as { color: { name: string } }
        const colorNames = colors.map((c: any) => c.name)

        setFetchedData({ colorNames, paletteTitle: palette_name, baseColorName: colorName.color.name })
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
