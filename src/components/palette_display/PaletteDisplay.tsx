import { ScissorsIcon } from '@heroicons/react/24/outline'
import { ColorName } from '../../App'
import { Palettes } from '../../types'
import './palette-display.css'
import { PaletteKinds, Variations } from '../../types'

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}

type ColorSpace = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3'

type PaletteDisplayProps = {
  palettes: Palettes
  colorSpace: ColorSpace
  palette: PaletteKinds
  variation: keyof Variations
  colorName: ColorName,
  setMsg: Function
}

export function PaletteDisplay({ palettes, colorSpace, palette, variation, colorName, setMsg }: PaletteDisplayProps) {
  const currentPalette = palettes[palette][variation]

  const hexStr = currentPalette.map(color => color.hex.string.replace('#', '')).join(',')

  async function handleCopy(txt: string) {
    try {
      await navigator.clipboard.writeText(txt)
      setMsg(`Copied ${txt} to clipboard`)
    } catch(e) {
      console.error(e)
    }

  }

  return (
    <section className="palette-display-container">
      {currentPalette.map((color, idx) => (
        <button
          className="palette-display"
          key={color.code}
          style={{ '--color': color[colorSpace].css, '--text': color[colorSpace].contrast }}
          onClick={() => handleCopy(color[colorSpace].string)}
        >
          <span>{colorName.fetchedData?.colorNames[idx]}</span>{' '}
          <span>
            {color[colorSpace].string} {color[colorSpace].isInGamut ? undefined : <ScissorsIcon className="icon" />}
          </span>
        </button>
      ))}
    </section>
  )
}
