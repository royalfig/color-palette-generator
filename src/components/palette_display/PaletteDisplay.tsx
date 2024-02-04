import { useFetchColorNames } from '../../hooks/useColorName'
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
  console.log("🚀 ~ PaletteDisplay ~ currentPalette:", currentPalette)

  const hexStr = currentPalette.map(color => color.hex.string.replace('#', '')).join(',')
  
  const {error, fetchedData, isLoading} = useFetchColorNames(hexStr)
  
  
  console.log("🚀 ~ PaletteDisplay ~ error, fetchedData, isLoading:", error, fetchedData, isLoading)
  return (
    <section className="palette-display-container">
      {currentPalette.map((color, idx) => (
        <button
          className="palette-display"
          key={color.code}
          style={{ '--color': color[colorSpace].css, '--text': color[colorSpace].contrast }}
        >
          {fetchedData?.colorNames[idx]} | {color[colorSpace].string} | {color[colorSpace].isInGamut ? 'in gamut' : 'out of gamut'} 
        </button>
      ))}
    </section>
  )
}
