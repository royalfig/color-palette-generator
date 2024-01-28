import Color from 'colorjs.io'
import { useEffect, useState } from 'react'
import ColorHistory from './components/color-history/ColorHistory'
import { ColorSelector } from './components/color-selector/ColorSelector'
import { ControlGroup } from './components/control-group/ControlGroup'
import { CurrentColorDisplay } from './components/current-color-display/CurrentColorDisplay'
import { DarkMode } from './components/dark_mode/DarkMode'
import { Display } from './components/display/Display'
import { ExportCSS, ExportImage, ExportJSON } from './components/exports/Exports'
import { EyeDropper } from './components/eye-dropper/EyeDropper'
import { InputColorContainer } from './components/input-color-container/InputColorContainer'
import PaletteSelector from './components/palette_selector/PaletteSelector'
import { VariationSelector } from './components/variations/Variations'
import { VibrancyModule } from './components/vibrancy_module/VibrancyModule'
import './css/Reset.css'
import './css/Variables.css'
import './css/Defaults.css'
import './css/utils.css'
import './css/App.css'
import { useBaseColor } from './hooks/useBaseColor'
import { generateCss } from './util/generateCss'
import { createPalettes } from './util/palettes'
import { PaletteDisplay } from './components/palette_display/PaletteDisplay'
import Button from './components/button/Button'
import { InputTypeSelector } from './components/input-text-type-selector/InputTypeSelector'
import { PaletteInfo } from './components/palette_info/PaletteInfo'
import { Share } from './components/share/Share'
export type ColorTypes = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3'

function pickRandomColor() {
  const popularColors = [
    '#F44336', // Red
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#03A9F4', // Light Blue
    '#00BCD4', // Teal
    '#009688', // Green
    '#4CAF50', // Lime
    '#00796B', // Teal Green
    '#33691E', // Dark Green
    '#E67E22', // Deep Orange
    '#F4511E', // Orange
    '#FF9800', // Amber
    '#FF5722', // Material Orange
    '#795542', // Brown
    '#5D4037', // Dark Brown
    '#FFC107', // Yellow
    '#FFFF00', // Yellow
    '#FFF400', // Light Yellow
    '#8BC34A', // Lime Green
    '#4CAF50', // Light Green
    '#AEEA00', // Yellow Green
    '#66BB66', // Medium Aquamarine
    '#9CCC66', // Light Green
    '#2E7D32', // Sea Green
    '#1B5E20', // Forest Green
    '#00C853', // Green
    '#00695C', // Dark Green
    '#26A662', // Cyan
    '#00897B', // Teal Blue
    '#00B7FF', // Light Blue
    '#ADD8E6', // Light Blue
    '#F0F4FF', // Azure
    '#82CAFF', // Medium Blue
    '#2196F3', // Blue
    '#3F51B5', // Indigo
    '#663399', // Purple
    '#6200EA', // Deep Purple
    '#303F9F', // Blue Violet
    '#9C27B0', // Purple
    '#E91E63', // Pink
    '#F44336', // Red
    '#FF7F50', // Coral
    '#F06292', // Orange Red
    '#FF0080', // Red
    '#C62828', // Deep Red
    '#ED4C6D', // Crimson
    '#FF80AB', // Pink
    '#957DAD', // Plum
    '#D81B60', // Violet
    '#E67E22', // Orange
    '#009688', // Green
    '#00BCD4', // Teal
    '#03A9F4', // Light Blue
    '#2196F3', // Blue
    '#3F51B5', // Indigo
    '#673AB7', // Deep Purple
    '#9C27B0', // Purple
    '#E91E63', // Pink
    '#F44336', // Red
  ]

  return popularColors[Math.floor(Math.random() * popularColors.length)]
}

export default function App() {
  console.log('app rendering')
  const colorQueryParaCheck = new URLSearchParams(document.location.search).has('color');
  const colorQueryParam = colorQueryParaCheck ? new URLSearchParams(document.location.search).get('color') : null;
  const [color, setColor] = useState<string | Color>(colorQueryParam || pickRandomColor())
  const [baseColorName, setBaseColorName] = useState<string>('')
  const [palette, setPalette] = useState('comp')
  const [variation, setVariation] = useState('original')
  const [colorspaceType, setColorspaceType] = useState<ColorTypes>('hex')

  const palettes = createPalettes(color)
  const css = generateCss(palettes)
  const base = useBaseColor(palettes)

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
    <main>
      <div className="synth-container">
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
                  <CurrentColorDisplay base={base} setBaseColorName={setBaseColorName} baseColorName={baseColorName}  />
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
              <PaletteInfo palettes={palettes} base={base} variation={variation} colorspaceType={colorspaceType} palette={palette} baseColorName={baseColorName} />
            </div>
          </Display>
        </section>
          <div className="synth-left box-padding">
            <section className="control-section">
              <ControlGroup title="Color Space">
                <InputTypeSelector setColorSpace={setColorspaceType} current={colorspaceType} />
              </ControlGroup>

              <ControlGroup title="History">
                <ColorHistory palettes={palettes} setColor={setColor} />
              </ControlGroup>
            </section>

            <section className="control-section">
              <ControlGroup title="Controls">
                <EyeDropper setColor={setColor} />
                <DarkMode />
                <Share base={base}/>
              </ControlGroup>

              <ControlGroup title="Export">
                <ExportCSS css={css} />
                <ExportImage />
                <ExportJSON data={palettes} />
              </ControlGroup>
            </section>

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
            <PaletteDisplay palettes={palettes} palette={palette} variation={variation} colorSpace={colorspaceType} />
          </div>
        </div>
    </main>
  )
}
