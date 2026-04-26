import { PaletteKinds } from './types'

type PaletteColor = {
  code: string
  oklch: { contrast: string; raw: number[] }
}

export function generateCss(palettes: Record<string, Record<string, PaletteColor[]>>) {
  let css = ''

  // Generate CSS for each palette
  Object.keys(palettes).forEach((paletteName: string) => {
    const palette = palettes[paletteName]
    if (!palette) return
    css += `/* ${paletteName} */\n`
    Object.keys(palette).forEach((variationName: string) => {
      const variation = palette[variationName]
      if (!variation) return
      css += `/* ${variationName} */\n`
      variation.forEach((color) => {
        const {
          code,
          oklch: { contrast, raw },
        } = color
        css += `--${code}: ${raw.join(' ')}; --${code}-contrast: ${contrast};\n`
      })
    })
  })

  return css
}
