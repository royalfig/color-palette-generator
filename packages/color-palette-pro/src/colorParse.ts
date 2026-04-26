import Color from 'colorjs.io'
import type { PlainColorObject } from 'colorjs.io/types/src/color';
import { ColorSpace, ColorFormat } from './types'

type CreatedColorObj = {
  base: Color
  string: string
  css: string
  isInGamut: boolean
  contrast: string
  raw: number[]
  fallback: string
  outOfGamut: string
}

function roundNumber(num: number, precision: number) {
  // copied from colorjs lib for consistency
  let integerLength = (Math.floor(num) + "").length;

  if (precision > integerLength) {
    return +num.toFixed(precision - integerLength);
  } else {
    let p10 = 10 ** (integerLength - precision);
    return Math.round(num / p10) * p10;
  } 
}

export function createColorObj(color: string | Color | PlainColorObject, colorSpace: ColorSpace | 'hex', precision: number = 3): CreatedColorObj {
  const space: string = colorSpace === 'hex' ? 'srgb' : colorSpace
  const format: ColorFormat | undefined = colorSpace === 'hex' ? 'hex' : undefined
  const colorObj = new Color(color);
  const isInGamut = colorObj.inGamut(space);
  const converted = colorObj.to(space)
  const str = format ? converted.toString({ precision, format }) : converted.toString({ precision })
  const css = converted.display().toString()
  const raw = converted.coords.map(c => roundNumber(c, precision))
  const outOfGamut = converted.to('srgb').toString({format: 'hex', inGamut: false})
  const fallback = isInGamut ? css : converted.to('srgb').toString({format: 'hex'})
  const contrast = converted.contrastWCAG21('#fff') > converted.contrastWCAG21('#000') ? '#fff' : '#000'

  return {
    base: colorObj,
    string: str,
    css,
    isInGamut,
    contrast,
    raw,
    fallback,
    outOfGamut,
  }
}
