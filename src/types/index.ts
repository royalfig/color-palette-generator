export type PaletteKinds = 'ana' | 'tri' | 'tet' | 'com' | 'spl' | 'ton' | 'tas'

export type ColorSpace = 'srgb' | 'p3' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab'

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3' | 'srgb'

export type ColorSpaceAndFormat = { space: ColorSpace; format: ColorFormat }

export type PaletteStyle = 'mathematical' | 'optical' | 'adaptive' | 'warm-cool'

export type SliderType =
  | 'hue'
  | 'saturation'
  | 'lightness'
  | 'r'
  | 'g'
  | 'b'
  | 'lab-a'
  | 'lab-b'
  | 'oklab-a'
  | 'oklab-b'
  | 'p3-r'
  | 'p3-g'
  | 'p3-b'

/*
    'math'      // (was 'mathematical') - Pure, balanced harmony
  | 'free, earth, sky, water'       // (was 'optical') - Organic, found in nature
  | 'bold, feel, '    // (was 'adaptive') - Bold, emotional, artistic
  | 'star, moon, ' 
*/
