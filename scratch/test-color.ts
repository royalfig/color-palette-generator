import Color from 'colorjs.io'
import { toHex } from '../packages/color-palette-pro/src/code-mode/utils'

const c = new Color('oklch(0.10 0.003 240)')
console.log('Hex:', toHex(c))
console.log('Lightness:', c.oklch.l)
console.log('Chroma:', c.oklch.c)
console.log('Hue:', c.oklch.h)
