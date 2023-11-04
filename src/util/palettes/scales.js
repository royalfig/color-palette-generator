import { hsl, oklch } from '../../lib/colorParse.js'
import { colorFactory } from './factory.js'
import { filterGrayscale, filterContrast, interpolate } from 'culori/fn'

function createTones(baseColor) {
  const original = []
  const keel = []
  const cinematic = []
  const languid = []
  const sharkbite = []

  const dark = hsl(baseColor)
  dark.s = 0.25
  dark.l = 0.15
  const light = hsl(baseColor)
  light.s = 0.15
  light.l = 0.99
  const interpolatedColors = interpolate([dark, light])

  for (let index = 0; index < 10; index++) {
    const hslBase = hsl(baseColor)
    const oklchBase = oklch(baseColor)

    oklchBase.c = 10
    oklchBase.l = index * 10 + 8

    hslBase.s = 0.1
    hslBase.l = (index * 10 + 8) / 100

    const keelScale = filterGrayscale(0.75)(oklchBase)
    const lanquidScale = filterContrast(0.5)(oklchBase)
    // const sharkScale = filterContrast(1.5)(lchBase)
    original.push(colorFactory(hslBase, 'tint-og', index))
    keel.push(colorFactory(keelScale, 'tint-cinematic', index))
    cinematic.push(colorFactory(oklchBase, 'tint-keel', index))
    languid.push(colorFactory(lanquidScale, 'tint-languid', index))
    sharkbite.push(colorFactory(interpolatedColors(index / 10), 'tint-sharkbite', index))
  }
  return { original, keel, cinematic, languid, sharkbite }
}

function createPolychroma(baseColor) {}

function createTones(tintsAndShades) {}

export function create(baseColor) {
  const scales = createTones(baseColor)

  console.log(scales)
}

create('#ff0000')
