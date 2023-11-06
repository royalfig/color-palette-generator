import { hsl, oklch } from '../../lib/colorParse.js'
import { colorFactory } from './factory.js'
import {
  filterGrayscale,
  filterContrast,
  interpolate,
  fixupHueLonger,
  interpolatorLinear,
  interpolatorSplineBasis,
  interpolatorSplineMonotoneClosed,
} from 'culori/fn'

export function createScales(baseColor) {
  const tones = {
    original: [],
    keel: [],
    cinematic: [],
    languid: [],
    sharkbite: [],
  }

  const polychromia = {
    original: [],
    keel: [],
    cinematic: [],
    languid: [],
    sharkbite: [],
  }

  const tintsAndShades = {
    original: [],
    keel: [],
    cinematic: [],
    languid: [],
    sharkbite: [],
  }

  const ombre = {
    original: [],
    keel: [],
    cinematic: [],
    languid: [],
    sharkbite: [],
  }

  const dark = hsl(baseColor)
  dark.s = 0.25
  dark.l = 0.15
  const light = hsl(baseColor)
  light.s = 0.15
  light.l = 0.99
  const interpolatedColors = interpolate([dark, light])
  const start = hsl(baseColor)

  // Polychromia
  const end = { ...start, h: (start.h + 359) % 360 }
  const poly1 = interpolate([start, end], 'hsl', {
    h: {
      use: interpolatorLinear,
      fixup: fixupHueLonger,
    },
  })

  const poly2 = interpolate([start, end], 'lch', {
    h: {
      use: interpolatorLinear,
      fixup: fixupHueLonger,
    },
  })

  const poly3 = interpolate([start, end], 'hsl', {
    h: {
      use: interpolatorSplineMonotoneClosed,
      fixup: fixupHueLonger,
    },
  })

  const poly4 = interpolate([start, end], 'hsl', {
    h: {
      use: interpolatorSplineBasis,
      fixup: fixupHueLonger,
    },
  })

  const poly5 = interpolate([start, end], 'lab', {
    h: {
      use: interpolatorSplineMonotoneClosed,
      fixup: fixupHueLonger,
    },
  })

  // Ombre
  const ombreEnd = { ...start, h: (start.h + 180) % 360 }
  const ombre1 = interpolate([start, ombreEnd], 'hsl', {
    h: {
      use: interpolatorLinear,
      fixup: fixupHueLonger,
    },
  })

  const ombre2 = interpolate([start, ombreEnd], 'lch', {
    h: {
      use: interpolatorLinear,
      fixup: fixupHueLonger,
    },
  })

  const ombre3 = interpolate([start, ombreEnd], 'hsl', {
    h: {
      use: interpolatorSplineMonotoneClosed,
      fixup: fixupHueLonger,
    },
  })

  const ombre4 = interpolate([start, ombreEnd], 'hsl', {
    h: {
      use: interpolatorSplineBasis,
      fixup: fixupHueLonger,
    },
  })

  const ombre5 = interpolate([start, ombreEnd], 'lab', {
    h: {
      use: interpolatorSplineMonotoneClosed,
      fixup: fixupHueLonger,
    },
  })

  const hslTint = interpolate([start, '#fff'], 'hsl')
  const hslShade = interpolate([start, '#000'], 'hsl')
  const lchTint = interpolate([start, '#fff'], 'lch')
  const lchShade = interpolate([start, '#000'], 'lch')
  const labTint = interpolate([start, '#fff'], 'lab')
  const labShade = interpolate([start, '#000'], 'lab')

  for (let index = 0; index < 10; index++) {
    const hslBase = hsl(baseColor)
    const oklchBase = oklch(baseColor)

    oklchBase.c = 10
    oklchBase.l = index * 10 + 8

    hslBase.s = 0.1
    hslBase.l = (index * 10 + 8) / 100

    const keelScale = filterGrayscale(0.75)(oklchBase)
    const lanquidScale = filterContrast(0.5)(oklchBase)
    tones.original.push(colorFactory(hslBase, 'tones-og', index))
    tones.keel.push(colorFactory(keelScale, 'tones-cinematic', index))
    tones.cinematic.push(colorFactory(oklchBase, 'tones-keel', index))
    tones.languid.push(colorFactory(lanquidScale, 'tones-languid', index))
    tones.sharkbite.push(colorFactory(interpolatedColors(index / 10), 'tones-sharkbite', index))
    polychromia.original.push(colorFactory(poly1(index / 10), 'poly-og', index))
    polychromia.keel.push(colorFactory(poly2(index / 10), 'poly-cinematic', index))
    polychromia.cinematic.push(colorFactory(poly3(index / 10), 'poly-keel', index))
    polychromia.languid.push(colorFactory(poly4(index / 10), 'poly-languid', index))
    polychromia.sharkbite.push(colorFactory(poly5(index / 10), 'poly-sharkbite', index))
    ombre.original.push(colorFactory(ombre1(index / 10), 'ombre-og', index))
    ombre.keel.push(colorFactory(ombre2(index / 10), 'ombre-cinematic', index))
    ombre.cinematic.push(colorFactory(ombre3(index / 10), 'ombre-keel', index))
    ombre.languid.push(colorFactory(ombre4(index / 10), 'ombre-languid', index))
    ombre.sharkbite.push(colorFactory(ombre5(index / 10), 'ombre-sharkbite', index))

    if (index < 6) {
      tintsAndShades.original.push(colorFactory(hslShade((10 - index) / 10), 'tints-and-shades-og', index))
      tintsAndShades.keel.push(colorFactory(lchShade((10 - index) / 10), 'tints-and-shades-og', index))
      tintsAndShades.cinematic.push(colorFactory(lchShade((10 - index) / 5), 'tints-and-shades-og', index))
      tintsAndShades.languid.push(colorFactory(lchShade((10 - index) / 2), 'tints-and-shades-og', index))
      tintsAndShades.sharkbite.push(colorFactory(labShade((10 - index) / 10), 'tints-and-shades-og', index))
    } else {
      tintsAndShades.original.push(colorFactory(hslTint(index / 10), 'tints-and-shades-og', index))
      tintsAndShades.keel.push(colorFactory(lchShade(index / 10), 'tints-and-shades-og', index))
      tintsAndShades.cinematic.push(colorFactory(lchTint(index / 5), 'tints-and-shades-og', index))
      tintsAndShades.languid.push(colorFactory(lchTint(index / 2), 'tints-and-shades-og', index))
      tintsAndShades.sharkbite.push(colorFactory(labTint(index / 10), 'tints-and-shades-og', index))
    }
  }

  return { tones: tones, polychromia: polychromia, ombre: ombre, tintsAndShades: tintsAndShades }
}

createScales('#ff0000')
