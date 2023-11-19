import './css/Reset.css'
import './css/Defaults.css'
import './css/Variables.css'
import './css/App.css'
import './css/utils.css'
import { useEffect, useState, useRef } from 'react'
import { createPalettes } from './util/palettes'
import { Display } from './components/display/Display'
import { VibrancyModule } from './components/vibrancy_module/VibrancyModule'
import { ColorSelector } from './components/color-selector/ColorSelector'
import { CurrentColorDisplay } from './components/current-color-display/CurrentColorDisplay'
import { InputGroup } from './components/input-group/InputGroup'
import { InputColor } from './components/input-color/InputColor'

export default function App() {
  const [color, setColor] = useState<string>('#21a623')
  const [palettes, setPalettes] = useState(() => createPalettes(color))
  const prevColor = useRef(color)

  useEffect(() => {
    if (prevColor.current === color) return
    setPalettes(createPalettes(color))
    prevColor.current = color
  }, [color])

  console.log(palettes)
  const s = {
    '--bg-1': palettes.tones.original[4].hex,
    '--bg-2': palettes.tones.original[1].hex,
  } as React.CSSProperties

  return (
    <main style={s}>
      <div className="synth-container">
        <div className="synth-left">
          <div className="current-color">
            <Display spacing="05">
              <CurrentColorDisplay palettes={palettes} />
            </Display>
          </div>
          <div className="color-selector">
            <Display spacing="05">
              <ColorSelector palettes={palettes} setColor={setColor} />
            </Display>
          </div>
          <InputGroup>
            <div className="flex col gap-1 flex-1">
              <InputColor palettes={palettes} setColor={setColor} type="hex" />
              <InputColor palettes={palettes} setColor={setColor} type="hsl" />
              <InputColor palettes={palettes} setColor={setColor} type="rgb" />
              <InputColor palettes={palettes} setColor={setColor} type="p3" />
            </div>
            <div className="flex col gap-1 flex-1">
              <InputColor palettes={palettes} setColor={setColor} type="lch" />
              <InputColor palettes={palettes} setColor={setColor} type="oklch" />
              <InputColor palettes={palettes} setColor={setColor} type="lab" />
              <InputColor palettes={palettes} setColor={setColor} type="oklab" />
            </div>
          </InputGroup>
        </div>
        <div className="synth-center"></div>
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
