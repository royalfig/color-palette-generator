import { Schemes } from '../../util/palettes'
import './palette-display.css'

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}

type ColorSpace = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3'
type Palette = 'ana' | 'tones' | 'tints' | 'poly' | 'comp'
type Variation = 'original' | 'keel' | 'cinematic' | 'languid' | 'sharkbite'

type PaletteDisplayProps = {
  palettes: Schemes
  colorSpace: ColorSpace
  palette: string
  variation: string
}

export function PaletteDisplay({ palettes, colorSpace, palette, variation }: PaletteDisplayProps) {
  const currentPalette = palettes[palette][variation]
  return (
  
      <section className="palette-display-container">
        {currentPalette.map(color => (
          <button
            className="palette-display"
            key={color.code}
            style={{ '--color': color[colorSpace].css, '--text': color[colorSpace].contrast }}
          >
            {color[colorSpace].string}
          </button>
        ))}
      </section>
    
  )
}
