import Color from 'colorjs.io'
import { useEffect, useMemo, useState } from 'react'
import { ColorContext } from './components/ColorContext'
import { ColorDisplay } from './components/color-display/ColorDisplay'
import { Display } from './components/display/Display'
import { PaletteDisplay } from './components/palette-display/PaletteDisplay'
import { SectionHeader } from './components/section-header/SectionHeader'
import { Swatches } from './components/swatches/Swatches'
import './css/App.css'
import './css/Defaults.css'
import './css/Reset.css'
import './css/Variables.css'
import './css/utils.css'
import { useFetchColorNames } from './hooks/useColorName'
import type { ColorSpace, ColorFormat, PaletteKinds } from './types'
import { createPalettes } from './util'
import { pickRandomColor } from './util/pickRandomColor'
import { ColorSpaceSelector } from './components/color-space-selector/ColorSpaceSelector'
import { EyedropperIcon } from '@phosphor-icons/react/dist/csr/Eyedropper'
import Button from './components/button/Button'
import { EyeDropper } from './components/eye-dropper/EyeDropper'
import { InputColor } from './components/input-color/InputColor'
import { PaletteTypeSelector } from './palette-type-selector/PaletteTypeSelector'
import { PaletteStyleSelector } from './components/palette-style-selector/PaletteStyleSelector'
import { DisplayInfo } from './components/display-info/DisplayInfo'

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
  const [paletteType, setPaletteType] = useState<PaletteKinds>('spl')
  const [paletteStyle, setPaletteStyle] = useState<'mathematical' | 'optical' | 'adaptive' | 'warm-cool'>(
    'mathematical',
  )
  const [colorSpace, setColorSpace] = useState<{ space: ColorSpace; format: ColorFormat }>({
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

              <Swatches />
            </Display>
            <div className="synth-body col-12">
              <ColorSpaceSelector colorSpace={colorSpace} setColorSpace={setColorSpace} />
              <div className="input-color-container">
                <EyeDropper setColor={setColor} setColorSpace={setColorSpace} />
                <InputColor color={color} setColor={setColor} colorSpace={colorSpace} />
              </div>
              <PaletteTypeSelector paletteType={paletteType} setPaletteType={setPaletteType} />
              <PaletteStyleSelector paletteStyle={paletteStyle} setPaletteStyle={setPaletteStyle} />
              <DisplayInfo />
            </div>
          </main>
        </div>
      </div>
    </ColorContext>
  )
}
