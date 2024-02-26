import { PaletteKinds, Palettes, VariationKinds } from '../types'

export function generateCss(palettes: Palettes) {
  let css = ''

  // Generate CSS for each palette
  Object.keys(palettes).map((paletteName: string) => {
    css += `/* ${paletteName} */\n`
    Object.keys(palettes[paletteName as PaletteKinds]).map((variationName: string) => {
      css += `/* ${variationName} */\n`
      Object.keys(palettes[paletteName as PaletteKinds][variationName as VariationKinds]).map(colorIndex => {
        const {
          code,
          oklch: { contrast, raw },
        } = palettes[paletteName as PaletteKinds][variationName as VariationKinds][colorIndex]
        css += `--${code}: ${raw.join(' ')}; --${code}-contrast: ${contrast};\n`
      })
    })
  })

  return css
}
