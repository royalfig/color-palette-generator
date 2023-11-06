import { filterSaturate, filterContrast } from 'culori/fn'
import { colorFactory } from './factory.js'
import { hsl, lch } from '../../lib/colorParse.js'
import { createScales } from './scales.js'

const targetHues = {
  analogous: [0, 30, 60],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  complementary: [0, 180],
  splitComplementary: [0, 150, 210],
}

const variations = {
  original: {
    space: 'hsl',
    adjust: color => color,
  },
  keel: {
    space: 'oklch',
    adjust: color => color,
  },
  cinematic: {
    space: 'hsl',
    adjust: color => filterContrast(1.5, 'rgb')(filterSaturate(1.2, 'rgb')(color)),
  },
  languid: {
    space: 'hsl',
    adjust: color => filterSaturate(0.5, 'rgb')(color),
  },
  sharkbite: {
    space: 'hsl',
    adjust: color => filterSaturate(1.5, 'rgb')(color),
  },
}

function adjustHue(val) {
  if (val < 0) val += Math.ceil(-val / 360) * 360

  return val % 360
}

function createPalettes(baseColor) {
  const palettes = Object.keys(targetHues).reduce((hueAcc, hueKey) => {
    const v = Object.keys(variations).reduce((variationAcc, variationKey) => {
      const p = targetHues[hueKey].map((hue, idx) => {
        let base = variations[variationKey].space === 'hsl' ? hsl(baseColor) : lch(baseColor)
        base.h = adjustHue(base.h + hue)
        base = variations[variationKey].adjust(base)
        return colorFactory(base, variationKey + hueKey, idx)
      })

      variationAcc[variationKey] = [...p]
      return variationAcc
    }, {})

    hueAcc[hueKey] = v
    return hueAcc
  }, {})

  const scales = createScales(baseColor)
  console.log({ ...palettes, ...scales })
}

createPalettes('#a890d4')
