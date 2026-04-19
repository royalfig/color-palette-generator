import Color from 'colorjs.io'
import { ColorSpace, SliderType } from '../../types'
import { BaseColorData } from '../../util/factory'
import space from 'colorjs.io/types/src/space'

export interface SliderStrategy {
  label: string
  min: number
  max: number
  step?: number
  getValue: (color: BaseColorData) => number
  updateColor: (color: Color, value: number) => Color
  getTrackStyle: (values: Record<string, string | number>) => string
  getThumbStyle: (values: Record<string, string | number>) => string
}

const hueStrategy = (space: ColorSpace): SliderStrategy => ({
  label: 'Hue',
  min: 0,
  max: 360,
  step: 0.1,
  getValue: color => {
    const hueIndex = space === 'hsl' ? 0 : 2
    return color.conversions[space].coords[hueIndex]
  },
  updateColor: (color, value) => {
    color[space].h = value
    return color
  },
  getTrackStyle: values => {
    if (space === 'hsl') {
      return `linear-gradient(to right in hsl longer hue, hsl(0deg ${values.saturation} ${values.lightness}), hsl(360deg ${values.saturation} ${values.lightness}))`
    }
    return `linear-gradient(to right in ${space} longer hue, ${space}(${values.lightness} ${values.saturation} 0deg), ${space}(${values.lightness} ${values.saturation} 360deg))`
  },
  getThumbStyle: values =>
    space === 'hsl'
      ? `hsl(${values.hue} ${values.saturation} ${values.lightness})`
      : space === 'lch'
      ? `lch(${values.lightness} ${values.saturation} ${values.hue})`
      : `oklch(${values.lightness} ${values.saturation} ${values.hue})`,
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
      getTrackStyle: values =>
        `linear-gradient(to right, oklch(${values.lightness} 0 ${values.hue}), oklch(${values.lightness} 0.4 ${values.hue}))`,
      getThumbStyle: values => `oklch(${values.lightness} ${values.saturation} ${values.hue})`,
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
      getTrackStyle: values =>
        `linear-gradient(to right, lch(${values.lightness} 0 ${values.hue}), lch(${values.lightness} 150 ${values.hue}))`,
      getThumbStyle: values => `lch(${values.lightness} ${values.saturation} ${values.hue})`,
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
    getTrackStyle: values =>
      `linear-gradient(to right in hsl, hsl(${values.hue} 0% ${values.lightness}), hsl(${values.hue} 100% ${values.lightness}))`,
    getThumbStyle: values => `hsl(${values.hue} ${values.saturation} ${values.lightness})`,
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
      getTrackStyle: values =>
        `linear-gradient(to right in oklch, oklch(0 ${values.saturation} ${values.hue}), oklch(1 ${values.saturation} ${values.hue}))`,
      getThumbStyle: values => `oklch(${values.value} ${values.saturation} ${values.hue})`,
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
      getTrackStyle: values =>
        `linear-gradient(to right in lch, lch(0 ${values.saturation} ${values.hue}), lch(100 ${values.saturation} ${values.hue}))`,
      getThumbStyle: values => `lch(${values.value} ${values.saturation} ${values.hue})`,
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
      getTrackStyle: values =>
        `linear-gradient(to right in oklab, oklab(0 ${values['oklab-a']} ${values['oklab-b']}), oklab(1 ${values['oklab-a']} ${values['oklab-b']}))`,
      getThumbStyle: values => `oklab(${values.value} ${values['oklab-a']} ${values['oklab-b']})`,
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
      getTrackStyle: values =>
        `linear-gradient(to right in lab, lab(0 ${values['lab-a']} ${values['lab-b']}), lab(100 ${values['lab-a']} ${values['lab-b']}))`,
      getThumbStyle: values => `lab(${values.value} ${values['lab-a']} ${values['lab-b']})`,
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
    getTrackStyle: values =>
      `linear-gradient(to right, hsl(${values.hue} ${values.saturation} 0%), hsl(${values.hue} ${values.saturation} 50%), hsl(${values.hue} ${values.saturation} 100%))`,
    getThumbStyle: values => `hsl(${values.hue} ${values.saturation} ${values.value})`,
  }
}

const rgbStrategy = (coord: 'r' | 'g' | 'b'): SliderStrategy => ({
  label: coord === 'r' ? 'Red' : coord === 'g' ? 'Green' : 'Blue',
  min: 0,
  max: 1,
  step: 0.01,
  getValue: color => {
    const index = coord === 'r' ? 0 : coord === 'g' ? 1 : 2
    return color.conversions.rgb.coords[index]
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
  getThumbStyle: values =>
    coord === 'r'
      ? `color-mix(in srgb, red ${values['value-as-percent']}, gray)`
      : coord === 'g'
      ? `color-mix(in srgb, green ${values['value-as-percent']}, gray)`
      : `color-mix(in srgb, blue ${values['value-as-percent']}, gray)`,
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
    const actualCoord = coord.replace('p3-', '')
    color.p3[actualCoord] = value
    return color
  },
  getTrackStyle: () => {
    if (coord === 'p3-r') return 'linear-gradient(to right in display-p3, transparent, red)'
    if (coord === 'p3-g') return 'linear-gradient(to right in display-p3, transparent, green)'
    return 'linear-gradient(to right in display-p3, transparent, blue)'
  },
  getThumbStyle: values =>
    coord === 'p3-r'
      ? `color-mix(in display-p3, red ${values['value-as-percent']}, gray)`
      : coord === 'p3-g'
      ? `color-mix(in display-p3, green ${values['value-as-percent']}, gray)`
      : `color-mix(in display-p3, blue ${values['value-as-percent']}, gray)`,
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
  getTrackStyle: values =>
    `linear-gradient(to right in lab, 
     lab(${values.lightness} -125 ${values['lab-b']}), 
     lab(${values.lightness} 0 ${values['lab-b']}), 
     lab(${values.lightness} 125 ${values['lab-b']}))`,
  getThumbStyle: values => `lab(${values.lightness} ${values.value} ${values['lab-b']})`,
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
  getTrackStyle: values =>
    `linear-gradient(to right in lab, 
     lab(${values.lightness} ${values['lab-a']} -125), 
     lab(${values.lightness} ${values['lab-a']} 0), 
     lab(${values.lightness} ${values['lab-a']} 125))`,
  getThumbStyle: values => `lab(${values.lightness} ${values['lab-a']} ${values.value})`,
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
  getTrackStyle: values =>
    `linear-gradient(to right in oklab, 
    oklab(${values.lightness} -0.4 ${values['oklab-b']}), 
    oklab(${values.lightness} 0 ${values['oklab-b']}),
    oklab(${values.lightness} 0.4 ${values['oklab-b']}))`,
  getThumbStyle: values => `oklab(${values.lightness} ${values.value} ${values['oklab-b']})`,
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
  getTrackStyle: values =>
    `linear-gradient(to right in oklab, 
     oklab(${values.lightness} ${values['oklab-a']} -0.4),
     oklab(${values.lightness} ${values['oklab-a']} 0), 
     oklab(${values.lightness} ${values['oklab-a']} 0.4))`,
  getThumbStyle: values => `oklab(${values.lightness} ${values['oklab-a']} ${values.value})`,
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
