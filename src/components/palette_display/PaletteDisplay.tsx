import { ScissorsIcon } from '@heroicons/react/24/outline'
import { ColorName } from '../../App'
import { Palettes } from '../../types'
import './palette-display.css'

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}

type ColorSpace = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3'



type PaletteDisplayProps = {
  palettes: Palettes
  colorSpace: ColorSpace
  palette: string
  variation: string
  colorName: ColorName
}

export function PaletteDisplay({ palettes, colorSpace, palette, variation, colorName }: PaletteDisplayProps) {
  const currentPalette = palettes[palette][variation]

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
