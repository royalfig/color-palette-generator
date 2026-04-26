import { BaseColorData } from './factory'
import { ColorFormat } from './types'

export interface GenerateCssOptions {
  format: ColorFormat
  isUiMode?: boolean
  wrapper?: 'root' | 'none'
}

export function generateCssVariables(palette: BaseColorData[], options: GenerateCssOptions): string {
  const { format, isUiMode = false, wrapper = 'none' } = options

  const css = palette.map((color, idx) => {
    const code = isUiMode ? color.code : `${color.code.substring(0, 3)}-${idx + 1}`
    return `--color-${code}: ${color.conversions[format].value};\n--color-${code}-contrast: ${color.contrast};`
  }).join('\n')

  if (wrapper === 'root') {
    return `:root {\n${css}\n}`
  }

  return css
}
