import { PaletteKinds } from '@royalfig/color-palette-pro'
import { Circle } from '../circle/Circle'
import './palette-display.css'

export function PaletteDisplay(_props: { paletteType: PaletteKinds }) {
  return (
    <div className="palette-display">
      <div className="circle-container">
        <Circle type="default" />
      </div>
    </div>
  )
}
