import { ColorName } from '../../App'
import { Schemes } from '../../util/palettes'
import './palette-display.css'
import { ScissorsIcon } from '@heroicons/react/24/outline'

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
  colorName: ColorName
}

export function PaletteDisplay({ palettes, colorSpace, palette, variation, colorName }: PaletteDisplayProps) {
  const currentPalette = palettes[palette][variation]
  console.log('🚀 ~ PaletteDisplay ~ currentPalette:', currentPalette)

  const hexStr = currentPalette.map(color => color.hex.string.replace('#', '')).join(',')

  return (
    <section className="palette-display-container">
      {currentPalette.map((color, idx) => (
        <button
          className="palette-display"
          key={color.code}
          style={{ '--color': color[colorSpace].css, '--text': color[colorSpace].contrast }}
        >
          <span>{colorName.fetchedData?.colorNames[idx]}</span> <span>{color[colorSpace].string} {color[colorSpace].isInGamut ? undefined : <ScissorsIcon className="icon" />}</span>
        </button>
      ))}
    </section>
  )
}
