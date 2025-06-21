import { useEffect, useMemo, useState } from 'react'
import { ColorContext } from './components/ColorContext'
import { AuxillaryDisplay } from './components/auxillary-display/AuxillaryDisplay'
import { ColorDisplay } from './components/color-display/ColorDisplay'
import { ColorSpaceSelector } from './components/color-space-selector/ColorSpaceSelector'
import { DisplayInfo } from './components/display-info/DisplayInfo'
import { Display } from './components/display/Display'
import { HueSlider } from './components/hue-slider/HueSlider'
import { InputColorContainer } from './components/input-color-container/InputColorContainer'
import { PaletteDisplay } from './components/palette-display/PaletteDisplay'
import { PaletteStyleSelector } from './components/palette-style-selector/PaletteStyleSelector'
import { PaletteToolSelector } from './components/palette-tool-selector/PaletteToolSelector'
import { SectionHeader } from './components/section-header/SectionHeader'
import './css/App.css'
import './css/Defaults.css'
import './css/Reset.css'
import './css/Variables.css'
import './css/utils.css'
import { useFetchColorNames } from './hooks/useColorName'
import { PaletteTypeSelector } from './palette-type-selector/PaletteTypeSelector'
import type { ColorFormat, ColorSpace, ColorSpaceAndFormat, PaletteKinds } from './types'
import { createPalettes } from './util'
import { pickRandomColor } from './util/pickRandomColor'
import { Knob } from './components/knob/Knob'

export type ColorName = {
  fetchedData: {
    colorNames: string[]
    paletteTitle: string
  } | null
  isLoading: boolean
  error: Error | null
}

function updateFavicon(color: string) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Draw a filled circle with the current color
  ctx.clearRect(0, 0, size, size)
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()

  // Convert canvas to data URL
  const url = canvas.toDataURL('image/png')

  // Find or create the favicon link element
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
}

export default function App() {
  console.log('app rendering')
  const colorQueryParaCheck = new URLSearchParams(document.location.search).has('color')
  const colorQueryParam = colorQueryParaCheck ? new URLSearchParams(document.location.search).get('color') : null
  const [color, setColor] = useState<string>(colorQueryParam || pickRandomColor())
  const [showPaletteColors, setShowPaletteColors] = useState(false)
  const [paletteType, setPaletteType] = useState<PaletteKinds>('spl')
  const [paletteStyle, setPaletteStyle] = useState<'mathematical' | 'optical' | 'adaptive' | 'warm-cool'>(
    'mathematical',
  )
  const [colorSpace, setColorSpace] = useState<ColorSpaceAndFormat>({
    space: 'oklch',
    format: 'oklch',
  })

  const palette = useMemo(
    () => createPalettes(color, paletteType, paletteStyle, colorSpace),
    [color, paletteType, paletteStyle],
  )

  const colorContext = useMemo(() => ({ originalColor: color, palette }), [color, palette])

  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // const css = generateCss(palettes)
  // const base = useBaseColor(palettes)

  const { fetchedData, isLoading, error: colorNameError } = useFetchColorNames(palette)

  function logChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log(e.target.value)
  }

  // useEffect(() => {
  //   const styleEl = document.createElement('style')
  //   styleEl.textContent = `:root { ${css} }`
  //   styleEl.setAttribute('id', 'color-palette')
  //   document.head.append(styleEl)

  //   return () => {
  //     document.head.removeChild(styleEl)
  //   }
  // }, [css])

  useEffect(() => {
    updateFavicon(color)
  }, [color])

  return (
    <ColorContext value={colorContext}>
      <div className="bg">
        <div className="bg-inner">
          <main className="synth-container">
            <SectionHeader />
            <Display>
              <ColorDisplay
                fetchedData={fetchedData}
                isLoading={isLoading}
                error={colorNameError}
                colorSpace={colorSpace}
              />
              <PaletteDisplay
                fetchedData={fetchedData}
                isLoading={isLoading}
                error={colorNameError}
                paletteType={paletteType}
                paletteStyle={paletteStyle}
              />
              <AuxillaryDisplay
                showPaletteColors={showPaletteColors}
                colorSpace={colorSpace}
                colorNames={fetchedData?.colorNames || []}
                paletteType={paletteType}
                paletteStyle={paletteStyle}
              />
            </Display>
            <div className="synth-body col-12">
              <ColorSpaceSelector colorSpace={colorSpace} setColorSpace={setColorSpace} />
              <InputColorContainer setColor={setColor} setColorSpace={setColorSpace} colorSpace={colorSpace} />

              <PaletteTypeSelector paletteType={paletteType} setPaletteType={setPaletteType} />
              <PaletteStyleSelector paletteStyle={paletteStyle} setPaletteStyle={setPaletteStyle} />
              <PaletteToolSelector showPaletteColors={showPaletteColors} setShowPaletteColors={setShowPaletteColors} />

              <Knob />

              <DisplayInfo />
              <HueSlider setColor={setColor} colorSpace={colorSpace} />
            </div>
          </main>
        </div>
      </div>
    </ColorContext>
  )
}
