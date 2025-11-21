import { useState, useEffect, useRef, useMemo } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { BaseColorData } from '../util/factory'

// Color Name API response types
interface ColorNameApiColor {
  name: string
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  lab: { l: number; a: number; b: number }
  distance: number
}

interface ColorNameApiResponse {
  colors: ColorNameApiColor[]
  paletteTitle: string
}

interface IUseFetchWithAbortResponse {
  fetchedData: { colorNames: string[]; paletteTitle: string; baseColorName: string } | null
  isLoading: boolean
  error: Error | null
}

// Module-level cache to store API responses
const colorNameCache = new Map<string, ColorNameApiResponse>()

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
        // Handle empty palette
        if (palette.length === 0) {
          if (!signal.aborted) {
            setFetchedData({
              colorNames: [],
              paletteTitle: 'Color Palette',
              baseColorName: 'Unknown',
            })
            setIsLoading(false)
          }
          return
        }

        // API limit: max 100 colors per request
        const colorsToFetch = palette.slice(0, 100)
        const baseIndex = palette.findIndex(p => p.string === originalColor.string)

        // Prepare hex values (without #) for the API
        const hexValues = colorsToFetch.map(color => color.conversions.hex.value.replace('#', '')).join(',')

        // Build API URL with optimizations:
        // - list=bestOf: Uses a curated list of high-quality color names
        // - noduplicates=true: Ensures each color gets a unique name
        const apiUrl = new URL('https://api.color.pizza/v1/')
        apiUrl.searchParams.set('values', hexValues)
        apiUrl.searchParams.set('list', 'bestOf')
        apiUrl.searchParams.set('noduplicates', 'true')

        const urlString = apiUrl.toString()

        // Check cache first
        if (colorNameCache.has(urlString)) {
          const cachedData = colorNameCache.get(urlString)!
          processResponse(cachedData, palette, colorsToFetch, baseIndex, signal)
          return
        }

        // Fetch color names from Color Name API
        const response = await fetch(urlString, {
          signal,
          headers: {
            'X-Referrer': 'color-palette-pro',
          },
        })

        if (!response.ok) {
          // Try to parse error response
          let errorMessage = `API request failed: ${response.status} ${response.statusText}`
          try {
            const errorData = await response.json()
            if (errorData?.error?.message) {
              errorMessage = errorData.error.message
            }
          } catch {
            // Ignore JSON parse errors, use default message
          }
          throw new Error(errorMessage)
        }

        const data = (await response.json()) as ColorNameApiResponse

        // Validate response structure
        if (!data || !Array.isArray(data.colors)) {
          throw new Error('Invalid API response format')
        }

        // Cache the successful response
        colorNameCache.set(urlString, data)

        processResponse(data, palette, colorsToFetch, baseIndex, signal)
      } catch (e) {
        if (!signal.aborted) {
          setError(e instanceof Error ? e : new Error('An unexpected error occurred'))
          setIsLoading(false)
        }
      }
    },
    400, // 400ms debounce delay
  )

  const processResponse = (
    data: ColorNameApiResponse,
    palette: BaseColorData[],
    colorsToFetch: BaseColorData[],
    baseIndex: number,
    signal: AbortSignal,
  ) => {
    // Extract color names from the response
    const colorNames = data.colors.map(c => c.name)

    // If we had to truncate the palette, pad with empty strings
    if (palette.length > colorsToFetch.length) {
      colorNames.push(...Array(palette.length - colorsToFetch.length).fill(''))
    }

    const baseColorName =
      baseIndex !== -1 && baseIndex < colorNames.length ? colorNames[baseIndex] : colorNames[0] || 'Unknown'

    if (!signal.aborted) {
      setFetchedData({
        colorNames,
        paletteTitle: data.paletteTitle || 'Color Palette',
        baseColorName,
      })
      setIsLoading(false)
    }
  }

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
