export type PaletteKinds = 'ana' | 'tri' | 'tet' | 'com' | 'spl' | 'tas'

export type ColorSpace = 'srgb' | 'p3' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab'

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3' | 'srgb'

export type ColorSpaceAndFormat = { space: ColorSpace; format: ColorFormat }

export type PaletteStyle = 'square' | 'triangle' | 'circle' | 'diamond'

export type PaletteMode = 'palette' | 'ui' | 'code'

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

export interface SurfaceTreatment {
  /** Multiplier on the page-canvas (surface) intended brand chroma. */
  surfaceChromaScale: number
  /** Multiplier on container / sunken / overlay intended brand chroma. */
  containerChromaScale: number
  /** Added to each role's pole-damping floor so the tint survives nearer white/black. */
  minProximityBoost: number
  /** Extra lightness pushed into outline / outline-variant for crisper, higher-contrast edges. */
  outlineContrast: number
  /** Multiplier on each elevation tier's ΔL from the surface (>1 widens the stack). */
  elevationSpread: number
  /** Lightness shift applied to the whole surface stack in dark mode (diamond deepens for depth). */
  stackLShiftDark: number
  /** Lightness shift for the whole stack in light mode (negative off-whites the page so it can hold a tone — light surfaces near pure white cannot). */
  stackLShiftLight: number
  /** Shadow rendering: layered penumbra ('soft') or crisp offset block ('hard'). */
  shadowProfile: 'soft' | 'hard'
}
