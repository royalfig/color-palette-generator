import { FORMATS } from '@/lib/const'
import { generateTheme, type ThemeFormat } from '@royalfig/color-palette-pro'
import { useCallback } from 'react'
import { useTheme } from './useTheme'

/**
 * Shared editor/terminal theme export. Used by the footer Download-theme menu
 * and the settings menu so the serialization logic lives in one place.
 */
export function useThemeDownload() {
  const { palette, resolvedTheme, paletteKind, paletteStyle } = useTheme()

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const downloadTheme = useCallback(
    (outputFormat: ThemeFormat) => {
      const base = palette.find(c => c.isBase)!
      const serialized = generateTheme(
        base.color,
        palette,
        resolvedTheme === 'dark',
        paletteKind,
        paletteStyle,
        outputFormat,
      )
      const meta = FORMATS.find(f => f.value === outputFormat)!
      // Include the format in the filename so multi-downloads don't collide
      // (e.g. VS Code and Zed both emit .json).
      downloadFile(
        serialized,
        `color-code-${outputFormat}-${resolvedTheme}${meta.ext && '.'}${meta.ext && meta.ext}`,
        meta.mime,
      )
    },
    [palette, resolvedTheme, paletteKind, paletteStyle, downloadFile],
  )

  return { downloadFile, downloadTheme }
}
