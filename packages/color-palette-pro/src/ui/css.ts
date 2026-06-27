import { BaseColorData } from '../factory'
import { ColorFormat, PaletteStyle } from '../types/types'
import { generateElevationShadowVars } from './shadows'

export interface GenerateCssOptions {
  format: ColorFormat
  isUiMode?: boolean
  wrapper?: 'root' | 'none'
  /** Emit the brand-tinted elevation shadow system (UI mode only). Defaults to on in UI mode. */
  shadows?: boolean
  /** Palette style — selects the shadow profile (diamond = hard). Defaults to soft (square). */
  style?: PaletteStyle
}

export function generateCssVariables(palette: BaseColorData[], options: GenerateCssOptions): string {
  const { format, isUiMode = false, wrapper = 'none', shadows = true, style = 'square' } = options

  let css = palette
    .map((color, idx) => {
      const code = isUiMode ? color.code : `${color.code.substring(0, 3)}-${idx + 1}`
      return `--color-${code}: ${color.conversions[format].value};\n--color-${code}-contrast: ${color.contrast};`
    })
    .join('\n')

  // Elevation shadows are brand-tinted and mode-adapted, so they're derived from the primary
  // token + the inferred mode (surface lightness) and emitted as their own custom properties.
  if (isUiMode && shadows) {
    const primary = palette.find(p => p.code === 'primary')?.color
    const surface = palette.find(p => p.code === 'surface')?.color
    if (primary) {
      const isDarkMode = (surface?.oklch.l ?? 1) < 0.5
      const shadowVars = generateElevationShadowVars(primary, isDarkMode, format, style)
      css +=
        '\n' +
        Object.entries(shadowVars)
          .map(([k, v]) => `${k}: ${v};`)
          .join('\n')
    }
  }

  if (wrapper === 'root') {
    return `:root {\n${css}\n}`
  }

  return css
}
