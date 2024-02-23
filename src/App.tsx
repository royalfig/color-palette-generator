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
import { VariationSelector } from './components/variations/Variations'
import { VibrancyModule } from './components/vibrancy_module/VibrancyModule'
import './css/App.css'
import './css/Defaults.css'
import './css/Reset.css'
import './css/Variables.css'
import './css/utils.css'
import { useBaseColor } from './hooks/useBaseColor'
import { useFetchColorNames } from './hooks/useColorName'
import { generateCss } from './util/generateCss'
import { createPalettes } from './util/palettes'
import { pickRandomColor } from './util/pickRandomColor'
export type ColorTypes = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3'

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
  const [palette, setPalette] = useState('comp')
  const [variation, setVariation] = useState('original')
  const [colorspaceType, setColorspaceType] = useState<ColorTypes>('hex')

  const palettes = createPalettes(color)
  const css = generateCss(palettes)
  const base = useBaseColor(palettes)
  const fetchColorName = useFetchColorNames(palettes, palette, variation)

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
            <Button handler={() => console.log('about')} active={false}>
              About
            </Button>
            <Button handler={() => console.log('halp')} active={false}>
              Help
            </Button>
            <Display spacing="01">
              <VibrancyModule palettes={palettes} />
            </Display>
          </div>
        </div>
        <section className="synth-display">
          <Display spacing="04">
            <div className="synth-columns">
              <div>
                <div className="color-input-display">
                  <CurrentColorDisplay base={base} colorName={fetchColorName} palettes={palettes} setColor={setColor} />
                  <ColorSelector palettes={palettes} setColor={setColor} />
                </div>
                <InputColorContainer
                  palettes={palettes}
                  setColor={setColor}
                  base={base}
                  colorspaceType={colorspaceType}
                  setColorspaceType={setColorspaceType}
                />
              </div>
              <PaletteInfo
                palettes={palettes}
                base={base}
                variation={variation}
                colorspaceType={colorspaceType}
                palette={palette}
                colorName={fetchColorName}
              />
            </div>
          </Display>
        </section>
        <div className="synth-left box-padding">
          <section className="control-section">
            <ControlGroup title="Color Space">
              <InputTypeSelector setColorSpace={setColorspaceType} current={colorspaceType} />
            </ControlGroup>
          </section>

          <section className="control-section">
            <ControlGroup title="Controls">
              <EyeDropper setColor={setColor} />
              <DarkMode />
              <Share base={base} />
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

            <ControlGroup title="Variations">
              <VariationSelector variation={variation} setVariation={setVariation} />
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
          />
        </div>
      </main>
    </div>
  )
}
