import { Schemes } from './palettes'

export function generateCss(palettes: Schemes) {
  let css = ''

  // Generate CSS for each palette
  Object.keys(palettes).map((paletteName: string) => {
    css += `/* ${paletteName} */\n`
    Object.keys(palettes[paletteName]).map((variationName: string) => {
      css += `/* ${variationName} */\n`
      Object.keys(palettes[paletteName][variationName]).map(colorIndex => {
        const {
          code,
          oklch: { contrast, raw },
        } = palettes[paletteName][variationName][colorIndex]
        css += `--${code}: ${raw.join(' ')}; --${code}-contrast: ${contrast};\n`
      })
    })
  })

  return css
}
