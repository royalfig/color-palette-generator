import Color from 'colorjs.io'
import { useEffect, useState } from 'react'
import ColorHistory from './components/color-history/ColorHistory'
import { ColorSelector } from './components/color-selector/ColorSelector'
import { ControlGroup } from './components/control-group/ControlGroup'
import { CurrentColorDisplay } from './components/current-color-display/CurrentColorDisplay'
import { DarkMode } from './components/dark_mode/DarkMode'
import { Display } from './components/display/Display'
import { EyeDropper } from './components/eye-dropper/EyeDropper'
import { InputColorContainer } from './components/input-color-container/InputColorContainer'
import { VibrancyModule } from './components/vibrancy_module/VibrancyModule'
import './css/App.css'
import './css/Defaults.css'
import './css/Reset.css'
import './css/Variables.css'
import './css/utils.css'
import { useBaseColor } from './hooks/useBaseColor'
import { generateCss } from './util/generateCss'
import { createPalettes } from './util/palettes'
import PaletteSelector from './components/palette_selector/PaletteSelector'

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
  const [color, setColor] = useState<string | Color>(pickRandomColor())
  const [palette, setPalette] = useState('complementary')
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
        <div className="synth-left">
          <Display spacing="04">
            <div className="color-inputs">
              <div className="current-color">
                <CurrentColorDisplay palettes={palettes} />
              </div>
              <div className="color-selector">
                <ColorSelector palettes={palettes} setColor={setColor} />
              </div>
            </div>
          </Display>
          <section className="color-text-inputs">
            <InputColorContainer palettes={palettes} setColor={setColor} base={base} />
          </section>

          <ControlGroup title="History">
            <ColorHistory palettes={palettes} setColor={setColor} />
          </ControlGroup>

          <ControlGroup title="Controls">
            <EyeDropper setColor={setColor} />
            <DarkMode />
            <EyeDropper setColor={setColor} />
          </ControlGroup>

          <ControlGroup title="Export">
            <EyeDropper setColor={setColor} />
            <EyeDropper setColor={setColor} />
            <EyeDropper setColor={setColor} />
          </ControlGroup>

          <ControlGroup title="Palettes">
            <PaletteSelector palettes={palettes} palette={palette} setPalette={setPalette} />
          </ControlGroup>

          <ControlGroup title="Variations">
            <EyeDropper setColor={setColor} />
            <EyeDropper setColor={setColor} />
            <EyeDropper setColor={setColor} />
          </ControlGroup>
        </div>
        <div className="synth-center flex" style={{ justifyContent: 'flex-start' }}>
          <div className="flex col">
            {palettes.tones.original.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.tints.original.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.complementary.original.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.analogous.original.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.split.original.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.triadic.original.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.tetradic.original.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.tones.keel.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.tints.keel.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.complementary.keel.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.analogous.keel.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.split.keel.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.triadic.keel.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
          <div className="flex col">
            {palettes.tetradic.keel.map((color, idx) => (
              <div key={idx} style={{ backgroundColor: color.hex.string }} className="box"></div>
            ))}
          </div>
        </div>
        {/* <div className="synth-right"></div> */}
        <div className="synth-bottom">
          <h1 className="brand">
            <span>Color</span>Palette Pro
          </h1>
          <Display spacing="01">
            <VibrancyModule palettes={palettes} />
          </Display>
        </div>
      </div>
    </main>
  )
}
