import { filterSaturate, filterContrast, formatHsl } from 'culori/fn'
import { colorFactory } from './factory'
import { hsl, lch } from './colorParse'
import { createScales } from './scales'
import {Color} from 'culori'

const targetHues: {[key: string]: number[] } = {
  analogous: [0, 30, 60],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  complementary: [0, 180],
  splitComplementary: [0, 150, 210],
} 

const variations: {[key: string]: {space: string, adjust: Function}} = {
  original: {
    space: 'hsl',
    adjust: (color: Color) => color,
  },
  keel: {
    space: 'oklch',
    adjust: (color: Color) => color,
  },
  cinematic: {
    space: 'hsl',
    adjust: (color: Color) => filterContrast(1.5, 'rgb')(filterSaturate(1.2, 'rgb')(color)),
  },
  languid: {
    space: 'hsl',
    adjust: (color: Color) => filterSaturate(0.5, 'rgb')(color),
  },
  sharkbite: {
    space: 'hsl',
    adjust: (color: Color) => filterSaturate(1.5, 'rgb')(color),
  },
}

function adjustHue(val: number) {
  if (val < 0) val += Math.ceil(-val / 360) * 360
  return val % 360
}

type Schemes = {
  analogous: {
    original: ColorProps[];
    keel: ColorProps[];
    cinematic: ColorProps[];
    languid: ColorProps[];
    sharkbite: ColorProps[];
  };
  triadic: {
    original: ColorProps[];
    keel: ColorProps[];
    cinematic: ColorProps[];
    languid: ColorProps[];
    sharkbite: ColorProps[];    
  };
  tetradic: {
    original: ColorProps[];
    keel: ColorProps[];
    cinematic: ColorProps[];
    languid: ColorProps[];
    sharkbite: ColorProps[];
  };
  complementary: {
    original: ColorProps[];
    keel: ColorProps[];
    cinematic: ColorProps[];
    languid: ColorProps[];
    sharkbite: ColorProps[];
  };
  splitComplementary: {
    original: ColorProps[];
    keel: ColorProps[];
    cinematic: ColorProps[];
    languid: ColorProps[];
    sharkbite: ColorProps[];
  };
  tones: {
    original: ColorProps[];
    keel: ColorProps[];
    cinematic: ColorProps[]; 
    languid: ColorProps[];
    sharkbite: ColorProps[];
  };
  polychromia: {
    original: ColorProps[];
    keel: ColorProps[];
    cinematic: ColorProps[];
    languid: ColorProps[];
    sharkbite: ColorProps[];
  };
  ombre: {
    original: ColorProps[];
    keel: ColorProps[];
    cinematic: ColorProps[];
    languid: ColorProps[]; 
    sharkbite: ColorProps[];
  };
  tintsAndShades: {
    original: ColorProps[];
    keel: ColorProps[];
    cinematic: ColorProps[];
    languid: ColorProps[];
    sharkbite: ColorProps[];
  };
}

export interface ColorProps {
  code: string;
  hex: string;
  rgb: string;
  hsl: string;
  lch: string;
  oklch: string;
  lab: string;
  oklab: string;
  p3: string;
  inGamut: boolean;
  point: [number, number];
  css: string;
  cssRaw: string;
}

import {hex} from "./colorParse"

export function createPalettes(baseColor: Color | string): Schemes {
  console.log("🚀 ~ file: palettes.ts:129 ~ createPalettes ~  hex(baseColor):",  hex(baseColor))
  const palettes = Object.keys(targetHues).reduce<Record<string, any>>((hueAcc, hueKey) => {
    const v = Object.keys(variations).reduce<Record<string, any>>((variationAcc, variationKey) => {
      const p = targetHues[hueKey].map((hue, idx) => {
        let base = variations[variationKey].space === 'hsl' ? hsl(baseColor) : lch(baseColor)
        if (!base) {throw new Error('Base color is undefined')} 
        base.h = adjustHue(base.h! + hue)
        base = variations[variationKey].adjust(base)
        if (!base) {throw new Error('Base color is undefined')} 
        return colorFactory(base, variationKey + hueKey, idx)
      })

      variationAcc[variationKey] = [...p]
      return variationAcc
    }, {})

    hueAcc[hueKey] = v
    return hueAcc
  }, {})

  const scales = createScales(baseColor)
 return { ...palettes, ...scales } as Schemes
}
