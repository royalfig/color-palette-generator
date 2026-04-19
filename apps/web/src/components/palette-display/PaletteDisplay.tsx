import { PaletteKinds } from '../../types'
import { Circle } from '../circle/Circle'
import './palette-display.css'

function getPaletteType(paletteType: PaletteKinds) {
  switch (paletteType) {
    case 'ana':
      return 'Analogous'
    case 'com':
      return 'Complementary'
    case 'tri':
      return 'Triadic'
    case 'tet':
      return 'Tetradic'
    case 'spl':
      return 'Split Complementary'
    case 'tas':
      return 'Tints & Shades'
  }
}

export function PaletteDisplay({ paletteType }: { paletteType: PaletteKinds }) {
  const paletteTypeFullName = getPaletteType(paletteType)
  return (
    <div className="palette-display">
      <div className="circle-container">
        <Circle type="default" />
      </div>
    </div>
  )
}
