import { hsl, lch } from '../../lib/colorParse.js'
import { colorFactory } from './factory.js'

function createBasicScale(baseColor, isLch) {
  const tints = []

  const color = isLch ? lch(baseColor) : hsl(baseColor)
  for (let index = 0; index < 10; index++) {
    if (isLch) {
      color.c = 10
      color.l = index * 10 + 8
    } else {
      color.s = 0.1
      color.l = (index * 10 + 8) / 100
    }
    console.log(color)
    tints.push(colorFactory(color, 'tint', index))
  }
  return tints
}

export function createTones(baseColor) {
  const original = createBasicScale(baseColor)
  const keel = createBasicScale(baseColor, 'lch')

  console.log(original, keel)
}

createTones('#ff0000')
