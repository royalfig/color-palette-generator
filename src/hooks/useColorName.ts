import { useState, useEffect, useRef, useMemo } from 'react'
import { useDebouncedCallback } from 'use-debounce'
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
  const abortControllerRef = useRef<AbortController | null>(null)

  // Create a stable palette key for comparison
  const paletteKey = useMemo(() => palette.map(p => p.string).join('|'), [palette])

  const fetchColorName = useDebouncedCallback(
    async (palette: BaseColorData[], originalColor: BaseColorData, signal: AbortSignal) => {
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

          if (!signal.aborted) {
            setFetchedData({ colorNames, paletteTitle: palette_name, baseColorName })
            setIsLoading(false)
          }
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

        if (!signal.aborted) {
          setFetchedData({ colorNames, paletteTitle: palette_name, baseColorName: colorName.color.name })
          setIsLoading(false)
        }
      } catch (e) {
        if (!signal.aborted) {
          setError(e instanceof Error ? e : new Error('An unexpected error occurred'))
          setIsLoading(false)
        }
      }
    },
    400, // 400ms debounce delay
  )

  useEffect(() => {
    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setFetchedData(null)
    setError(null)

    // Trigger debounced fetch
    fetchColorName(palette, originalColor, controller.signal)

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteKey, originalColor.string])

  return { fetchedData, isLoading, error }
}
