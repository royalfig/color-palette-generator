export type PaletteKinds = 'ana' | 'tri' | 'tet' | 'com' | 'spl' | 'ton' | 'tas'

export type ColorSpace = 'oklch' | 'srgb' | 'lab' | 'lch' | 'hsl' | 'p3' | 'oklab'

export type ColorFormat = 'oklch' | 'srgb' | 'lab' | 'lch' | 'hsl' | 'p3' | 'oklab' | 'hex' | 'rgb'

export type ColorSpaceAndFormat = { space: ColorSpace; format: ColorFormat }

export type PaletteStyle = 'mathematical' | 'optical' | 'adaptive' | 'warm-cool'

/*
    'math'      // (was 'mathematical') - Pure, balanced harmony
  | 'free, earth, sky, water'       // (was 'optical') - Organic, found in nature
  | 'bold, feel, '    // (was 'adaptive') - Bold, emotional, artistic
  | 'star, moon, ' 
*/
