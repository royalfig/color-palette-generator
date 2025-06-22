import Color from 'colorjs.io'
import { ColorSpace, SliderType } from '../../types'
import { BaseColorData } from '../../util/factory'

export interface SliderStrategy {
  label: string
  min: number
  max: number
  step?: number
  getValue: (color: BaseColorData) => number
  updateColor: (color: Color, value: number) => Color
  getTrackStyle: (color: Color) => string
  thumbStyle: string
}

function getWorkingSpace(space: ColorSpace) {
  if (space === 'oklab' || space === 'oklch') return 'oklch'
  if (space === 'lab' || space === 'lch') return 'lch'
  return 'hsl'
}

const hueStrategy = (space: ColorSpace): SliderStrategy => ({
  label: 'Hue',
  min: 0,
  max: 360,
  getValue: color => {
    const hueIndex = space === 'hsl' ? 0 : 2
    return color.conversions[space].coords[hueIndex]
  },
  updateColor: (color, value) => {
    color[space].h = value
    return color
  },
  getTrackStyle: () => {
    if (space === 'hsl') {
      return `linear-gradient(to right in hsl longer hue, hsl(0deg var(--saturation) var(--lightness)), hsl(360deg var(--saturation) var(--lightness)))`
    }
    return `linear-gradient(to right in ${space} longer hue, ${space}(var(--lightness) var(--saturation) 0deg), ${space}(var(--lightness) var(--saturation) 360deg))`
  },
  thumbStyle:
    space === 'hsl'
      ? 'hsl(var(--hue) var(--saturation) var(--lightness))'
      : space === 'lch'
      ? 'lch(var(--lightness) var(--saturation) var(--hue))'
      : 'oklch(var(--lightness) var(--saturation) var(--hue))',
})

const saturationStrategy = (space: ColorSpace): SliderStrategy => {
  if (space === 'oklch') {
    return {
      label: 'Chroma',
      min: 0,
      max: 0.4,
      step: 0.01,
      getValue: color => color.conversions.oklch.coords[1],
      updateColor: (color, value) => {
        color.oklch.c = value
        return color
      },
      getTrackStyle: () =>
        `linear-gradient(to right, oklch(var(--lightness) 0 var(--hue)), oklch(var(--lightness) 0.4 var(--hue)))`,
      thumbStyle: 'oklch(var(--lightness) var(--saturation) var(--hue))',
    }
  }

  if (space === 'lch') {
    return {
      label: 'Chroma',
      min: 0,
      max: 150,
      getValue: color => color.conversions.lch.coords[1],
      updateColor: (color, value) => {
        color.lch.c = value
        return color
      },
      step: 1,
      getTrackStyle: () =>
        `linear-gradient(to right, lch(var(--lightness) 0 var(--hue)), lch(var(--lightness) 150 var(--hue)))`,
      thumbStyle: 'lch(var(--lightness) var(--saturation) var(--hue))',
    }
  }

  return {
    label: 'Saturation',
    min: 0,
    max: 100,
    step: 1,
    getValue: color => color.conversions.hsl.coords[1],
    updateColor: (color, value) => {
      color.hsl.s = value
      return color
    },
    getTrackStyle: () =>
      `linear-gradient(to right in hsl, hsl(var(--hue) 0% var(--lightness)), hsl(var(--hue) 100% var(--lightness)))`,
    thumbStyle: 'hsl(var(--hue) var(--saturation) var(--lightness))',
  }
}

const lightnessStrategy = (space: ColorSpace): SliderStrategy => {
  if (space === 'oklch') {
    return {
      label: 'Lightness',
      min: 0,
      max: 1,
      step: 0.01,
      getValue: color => color.conversions.oklch.coords[0],
      updateColor: (color, value) => {
        color.oklch.l = value
        return color
      },
      getTrackStyle: () =>
        `linear-gradient(to right, oklch(0 var(--saturation) var(--hue)), oklch(1 var(--saturation) var(--hue)))`,
      thumbStyle: 'oklch(var(--value) var(--saturation) var(--hue))',
    }
  }

  if (space === 'lch') {
    return {
      label: 'Lightness',
      min: 0,
      max: 100,

      getValue: color => color.conversions.lch.coords[0],
      updateColor: (color, value) => {
        color.lch.l = value
        return color
      },
      getTrackStyle: () =>
        `linear-gradient(to right, lch(0 var(--saturation) var(--hue)), lch(100 var(--saturation) var(--hue)))`,
      thumbStyle: 'lch(var(--value) var(--saturation) var(--hue))',
    }
  }

  if (space === 'oklab') {
    return {
      label: 'Lightness',
      min: 0,
      max: 1,
      step: 0.01,
      getValue: color => color.conversions.oklab.coords[0],
      updateColor: (color, value) => {
        color.oklab.l = value
        return color
      },
      getTrackStyle: () =>
        `linear-gradient(to right, oklab(0 var(--oklab-a) var(--oklab-b)), oklab(1 var(--oklab-a) var(--oklab-b)))`,
      thumbStyle: 'oklab(var(--value) var(--oklab-a) var(--oklab-b))',
    }
  }

  if (space === 'lab') {
    return {
      label: 'Lightness',
      min: 0,
      max: 100,
      getValue: color => color.conversions.lab.coords[0],
      updateColor: (color, value) => {
        color.lab.l = value
        return color
      },
      getTrackStyle: () =>
        `linear-gradient(to right, lab(0 var(--lab-a) var(--lab-b)), lab(100 var(--lab-a) var(--lab-b)))`,
      thumbStyle: 'lab(var(--value) var(--lab-a) var(--lab-b))',
    }
  }

  return {
    label: 'Lightness',
    min: 0,
    max: 100,
    getValue: color => color.conversions.hsl.coords[2],
    updateColor: (color, value) => {
      color.hsl.l = value
      return color
    },
    getTrackStyle: () =>
      `linear-gradient(to right, hsl(var(--hue) var(--saturation) 0%), hsl(var(--hue) var(--saturation) 50%), hsl(var(--hue) var(--saturation) 100%))`,
    thumbStyle: 'hsl(var(--hue) var(--saturation) var(--value))',
  }
}

const rgbStrategy = (coord: 'r' | 'g' | 'b'): SliderStrategy => ({
  label: coord === 'r' ? 'Red' : coord === 'g' ? 'Green' : 'Blue',
  min: 0,
  max: 100,
  getValue: color => {
    const index = coord === 'r' ? 0 : coord === 'g' ? 1 : 2
    return color.conversions.rgb.coords[index] * 100
  },
  updateColor: (color, value) => {
    color.srgb[coord] = value
    return color
  },
  getTrackStyle: () => {
    if (coord === 'r') return 'linear-gradient(to right, transparent, red)'
    if (coord === 'g') return 'linear-gradient(to right, transparent, green)'
    return 'linear-gradient(to right, transparent, blue)'
  },
  thumbStyle:
    coord === 'r'
      ? 'color-mix(in srgb, red var(--value-as-percent), gray)'
      : coord === 'g'
      ? 'color-mix(in srgb, green var(--value-as-percent), gray)'
      : 'color-mix(in srgb, blue var(--value-as-percent), gray)',
})

const p3Strategy = (coord: 'p3-r' | 'p3-g' | 'p3-b'): SliderStrategy => ({
  label: coord === 'p3-r' ? 'Red' : coord === 'p3-g' ? 'Green' : 'Blue',
  min: 0,
  max: 1,
  step: 0.01,
  getValue: color => {
    const index = coord === 'p3-r' ? 0 : coord === 'p3-g' ? 1 : 2
    return color.conversions.p3.coords[index]
  },
  updateColor: (color, value) => {
    color.p3[coord] = value
    return color
  },
  getTrackStyle: () => {
    if (coord === 'p3-r') return 'linear-gradient(to right, transparent, red)'
    if (coord === 'p3-g') return 'linear-gradient(to right, transparent, green)'
    return 'linear-gradient(to right, transparent, blue)'
  },
  thumbStyle:
    coord === 'p3-r'
      ? 'color-mix(in display-p3, red var(--value-as-percent), gray)'
      : coord === 'p3-g'
      ? 'color-mix(in display-p3, green var(--value-as-percent), gray)'
      : 'color-mix(in display-p3, blue var(--value-as-percent), gray)',
})

const labAStrategy = (): SliderStrategy => ({
  label: 'a',
  min: -125,
  max: 125,
  getValue: color => color.conversions.lab.coords[1],
  updateColor: (color, value) => {
    color.lab.a = value
    return color
  },
  getTrackStyle: () =>
    `linear-gradient(to right, lab(var(--lightness) var(--lab-b) -125), lab(var(--lightness) var(--lab-b) 0), lab(var(--lightness) var(--lab-b) 125))`,
  thumbStyle: 'lab(var(--lightness) var(--lab-b) var(--value))',
})

const labBStrategy = (): SliderStrategy => ({
  label: 'b',
  min: -125,
  max: 125,
  getValue: color => color.conversions.lab.coords[2],
  updateColor: (color, value) => {
    color.lab.b = value
    return color
  },
  getTrackStyle: () =>
    `linear-gradient(to right, lab(var(--lightness) -125 var(--lab-b)), lab(var(--lightness) 0 var(--lab-b)), lab(var(--lightness) 125 var(--lab-b)))`,
  thumbStyle: 'lab(var(--lightness) var(--lab-a) var(--value))',
})

const oklabAStrategy = (): SliderStrategy => ({
  label: 'a',
  min: -0.4,
  max: 0.4,
  step: 0.01,
  getValue: color => color.conversions.oklab.coords[1],
  updateColor: (color, value) => {
    color.oklab.a = value
    return color
  },
  getTrackStyle: () =>
    `linear-gradient(to right, oklab(var(--lightness) var(--oklab-b) -0.4), oklab(var(--lightness) var(--oklab-b) 0), oklab(var(--lightness) var(--oklab-b) 0.4))`,
  thumbStyle: 'oklab(var(--lightness) var(--oklab-b) var(--value))',
})

const oklabBStrategy = (): SliderStrategy => ({
  label: 'b',
  min: -0.4,
  max: 0.4,
  step: 0.01,
  getValue: color => color.conversions.oklab.coords[2],
  updateColor: (color, value) => {
    color.oklab.b = value
    return color
  },
  getTrackStyle: () =>
    `linear-gradient(to right, oklab(var(--lightness) var(--oklab-a) -0.4), oklab(var(--lightness) var(--oklab-a) 0), oklab(var(--lightness) var(--oklab-a) 0.4))`,
  thumbStyle: 'oklab(var(--lightness) var(--oklab-a) var(--value))',
})

export function getSliderStrategy(type: SliderType, colorSpace: ColorSpace): SliderStrategy {
  switch (type) {
    case 'hue':
      return hueStrategy(colorSpace)
    case 'saturation':
      return saturationStrategy(colorSpace)
    case 'lightness':
      return lightnessStrategy(colorSpace)
    case 'r':
    case 'g':
    case 'b':
      return rgbStrategy(type)
    case 'p3-r':
    case 'p3-g':
    case 'p3-b':
      return p3Strategy(type)
    case 'lab-a':
      return labAStrategy()
    case 'lab-b':
      return labBStrategy()
    case 'oklab-a':
      return oklabAStrategy()
    case 'oklab-b':
      return oklabBStrategy()
    default:
      throw new Error(`Invalid slider type: ${type}`)
  }
}
