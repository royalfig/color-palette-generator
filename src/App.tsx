import Color from 'colorjs.io'
import { useEffect, useState } from 'react'
import Button from './components/button/Button'
import { ColorSelector } from './components/color-selector/ColorSelector'
import { ControlGroup } from './components/control-group/ControlGroup'
import { CurrentColorDisplay } from './components/current-color-display/CurrentColorDisplay'
import { DarkMode } from './components/dark_mode/DarkMode'
import { Display } from './components/display/Display'
import { ExportCSS, ExportImage, ExportJSON } from './components/exports/Exports'
import { EyeDropper } from './components/eye-dropper/EyeDropper'
import { InputColorContainer } from './components/input-color-container/InputColorContainer'
import { InputTypeSelector } from './components/input-text-type-selector/InputTypeSelector'
import { PaletteDisplay } from './components/palette_display/PaletteDisplay'
import { PaletteInfo } from './components/palette_info/PaletteInfo'
import PaletteSelector from './components/palette_selector/PaletteSelector'
import { Share } from './components/share/Share'
import { UiMode } from './components/ui/UiMode'
import { VibrancyModule } from './components/vibrancy_module/VibrancyModule'
import './css/App.css'
import './css/Defaults.css'
import './css/Reset.css'
import './css/Variables.css'
import './css/utils.css'
import { useBaseColor } from './hooks/useBaseColor'
import { useFetchColorNames } from './hooks/useColorName'
import { ColorSpace, PaletteKinds, Variations } from './types'
import { generateCss } from './util/generateCss'
import { createPalettes } from './util/palettes'
import { pickRandomColor } from './util/pickRandomColor'

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
  const [color, setColor] = useState<string | Color>(colorQueryParam || pickRandomColor())
  const [palette, setPalette] = useState<PaletteKinds>('com')
  const [variation, setVariation] = useState<keyof Variations>('og')
  const [colorspaceType, setColorspaceType] = useState<ColorSpace>('hex')
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const palettes = createPalettes(color)
  const css = generateCss(palettes)
  const base = useBaseColor(palettes)
  const fetchColorName = useFetchColorNames(palettes, palette, variation)

  function logChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log(e.target.value)
  }

  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = `:root { ${css} }`
    styleEl.setAttribute('id', 'color-palette')
    document.head.append(styleEl)

    return () => {
      document.head.removeChild(styleEl)
    }
  }, [css])

  return (
    <div className="bg">
      <main className="synth-container">
        <div className="synth-brand">
          <h1 className="brand">
            <span>Color</span>Palette Pro
          </h1>
          <div className="flex gap-4">
            <InputTypeSelector setColorSpace={setColorspaceType} current={colorspaceType} />
          </div>
        </div>
        <section className="synth-display">
          <Display spacing="04">
            <div className="synth-columns">
              <div className="color-input-display">
                <CurrentColorDisplay
                  base={base}
                  colorName={fetchColorName}
                  palettes={palettes}
                  setColor={setColor}
                  colorSpace={colorspaceType}
                />
                <ColorSelector palettes={palettes} setColor={setColor} colorSpace={colorspaceType} />
                <InputColorContainer
                  palettes={palettes}
                  setColor={setColor}
                  base={base}
                  colorspaceType={colorspaceType}
                  setColorspaceType={setColorspaceType}
                  setError={setError}
                  setIsActive={setIsActive}
                  isActive={isActive}
                />
              </div>
              <PaletteInfo
                palettes={palettes}
                base={base}
                variation={variation}
                colorspaceType={colorspaceType}
                palette={palette}
                colorName={fetchColorName}
                error={error}
                isActive={isActive}
                msg={msg}
              />
            </div>
          </Display>
        </section>
        <div className="synth-left box-padding">
          <section className="control-section"></section>

          <section className="control-section">
            <ControlGroup title="Controls">
              <EyeDropper setColor={setColor} />
              <DarkMode />
              <Share base={base} />
              <UiMode />
            </ControlGroup>

            <ControlGroup title="Export">
              <ExportCSS css={css} />
              <ExportImage
                colorNames={fetchColorName}
                palettes={palettes}
                palette={palette}
                variation={variation}
                colorSpace={colorspaceType}
              />
              <ExportJSON data={palettes} />
            </ControlGroup>
          </section>
        </div>
        <div className="synth-center box-padding">
          <section className="control-section">
            <ControlGroup title="Palettes">
              <PaletteSelector palettes={palettes} palette={palette} setPalette={setPalette} />
            </ControlGroup>

            <ControlGroup title="Fuzz">
              <input type="range" min={0} max={100} onChange={logChange} />
              {/* <VariationSelector variation={variation} setVariation={setVariation} /> */}
            </ControlGroup>
          </section>
        </div>
        <div className="synth-right box-padding">
          <PaletteDisplay
            palettes={palettes}
            palette={palette}
            variation={variation}
            colorSpace={colorspaceType}
            colorName={fetchColorName}
            setMsg={setMsg}
          />
        </div>
      </main>
    </div>
  )
}
