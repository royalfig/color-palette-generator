import './css/Reset.css'
import './css/Defaults.css'
import './css/Variables.css'
import './css/App.css'
import './css/utils.css'
import { useState } from 'react'
import { createPalettes } from './util/palettes/palettes.js'
import { Display } from './components/display/Display'
import { VibrancyModule } from './components/vibrancy_module/VibrancyModule'
import { ColorSelector } from './components/color-selector/ColorSelector'
import { CurrentColorDisplay } from './components/current-color-display/CurrentColorDisplay'
import { InputGroup } from './components/input-group/InputGroup'
import { InputColor } from './components/input-color/InputColor'

export default function App() {
  const [color, setColor] = useState('#21a623')
  const palettes = createPalettes(color)

  const s = {'--bg-1': palettes.tones.original[4].hex, '--bg-2': palettes.tones.original[1].hex} as React.CSSProperties

  console.log(s)
  // const palettes = createPalettes(color)

  return (
    <main style={s}>
      <div className="synth-container" > 
        <div className="synth-left">
          <div className="current-color">
            <Display spacing="05">
              <CurrentColorDisplay color={color} />
            </Display>
          </div>
          <div className="color-selector">
            <Display spacing="05">
              <ColorSelector color={color} setColor={setColor} />
             </Display>
          </div>
          <InputGroup>
            <InputColor palettes={palettes} setColor={setColor} type="hex" />
            <InputColor palettes={palettes} setColor={setColor} type="hsl" />
            <InputColor palettes={palettes} setColor={setColor} type="rgb" />
            <InputColor palettes={palettes} setColor={setColor} type="lch" />
            <InputColor palettes={palettes} setColor={setColor} type="oklch" />
            <InputColor palettes={palettes} setColor={setColor} type="lab" />
            <InputColor palettes={palettes} setColor={setColor} type="oklab" />
          </InputGroup>
        </div>
        <div className="synth-center"></div>
        <div className="synth-right"></div>
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


