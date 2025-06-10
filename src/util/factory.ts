import Color from 'colorjs.io'

export type BaseColorData = {
  code: `${string}-${number}`
  base: string | Color
  color: Color
  colorSpace: string
  cssValue: string
  contrast: string
  inSrgbGamut: boolean
  inP3Gamut: boolean
  inLchGamut: boolean
  string: string
  conversions: {
    [key: string]: string
  }
  fallback: string
}

export function colorFactory(
  base: string | Color,
  paletteInformation: string,
  idx = 0,
  format?: 'hex' | 'rgb' | 'hsl' | 'oklch' | 'oklab' | 'lch' | 'lab' | 'p3',
): BaseColorData {
  const color = base instanceof Color ? base : new Color(base)

  return {
    code: `${paletteInformation}-${idx + 1}`,
    base,
    color,
    colorSpace: color.spaceId,
    cssValue: color.display().toString(),
    contrast: color.contrastWCAG21('#fff') > color.contrastWCAG21('#000') ? '#fff' : '#000',
    inSrgbGamut: color.inGamut('srgb'),
    inP3Gamut: color.inGamut('p3'),
    inLchGamut: color.inGamut('lch'),
    string: color.toString({ format }),
    fallback: color.to('srgb').toString({ clip: true, format }),
    conversions: {
      hex: color.to('srgb').toString({ format: 'hex' }),
      rgb: color.to('srgb').toString(),
      hsl: color.to('hsl').toString(),
      lch: color.to('lch').toString(),
      oklch: color.to('oklch').toString(),
      lab: color.to('lab').toString(),
      oklab: color.to('oklab').toString(),
      p3: color.to('p3').toString(),
    },
  }
}
