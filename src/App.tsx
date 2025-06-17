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

export type ColorName = {
  fetchedData: {
    colorNames: string[]
    paletteTitle: string
  } | null
  isLoading: boolean
  error: Error | null
}

export default function App() {
  console.log('app rendering')
  const colorQueryParaCheck = new URLSearchParams(document.location.search).has('color')
  const colorQueryParam = colorQueryParaCheck ? new URLSearchParams(document.location.search).get('color') : null
  const [color, setColor] = useState<string>(colorQueryParam || pickRandomColor())
  const [paletteType, setPaletteType] = useState<PaletteKinds>('ana')
  const palette = useMemo(() => createPalettes(color, paletteType, 'mathematical'), [color, paletteType])
  const colorObj = new Color(color)

  const colorContext = useMemo(() => ({ color, palette, colorObj }), [color, palette, colorObj])

  const [colorSpace, setColorSpace] = useState<{ space: ColorSpace; format: ColorFormat }>({
    space: 'srgb',
    format: 'hex',
  })
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
              />

              <Swatches />
            </Display>
            <div className="synth-body col-12">
              <ColorSpaceSelector colorSpace={colorSpace} setColorSpace={setColorSpace} />
              <EyeDropper setColor={setColor} setColorSpace={setColorSpace} />
              <InputColor color={color} setColor={setColor} colorSpace={colorSpace} />
            </div>
          </main>
        </div>
      </div>
    </ColorContext>
  )
}
