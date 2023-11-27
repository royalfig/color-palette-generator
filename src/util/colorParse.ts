import Color from 'colorjs.io'
import { PlainColorObject } from 'colorjs.io/types/src/color';

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

export function createColorObj(color: string | Color | PlainColorObject, colorSpace: 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3' | 'srgb' | 'hsl' | 'hex' , precision: number = 3) {
  const space = colorSpace === 'hex' ? 'srgb' : colorSpace
  const format = colorSpace === 'hex' ? 'hex' : ''
  const colorObj = new Color(color);
  const isInGamut = colorObj.inGamut(space);
  const converted = colorObj.to(space)
  const str = converted.toString({ precision, format });
  const css = converted.display().toString()
  const raw = converted.coords.map(c => roundNumber(c, precision))
  const outOfGamut = converted.to('srgb').toString({format: 'rgb', inGamut: false})
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

export type ReturnColor = ReturnType<typeof createColorObj>