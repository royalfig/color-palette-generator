import { SwatchesIcon } from '@phosphor-icons/react/dist/csr/Swatches'
import './palette-display.css'
import { Circle } from '../circle/Circle'
import { ColorSpace, PaletteKinds } from '../../types'

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

export function PaletteDisplay({
  fetchedData,
  isLoading,
  error,
  paletteType,
  paletteStyle,
}: {
  fetchedData: { colorNames: string[]; paletteTitle: string } | null
  isLoading: boolean
  error: Error | null
  paletteType: PaletteKinds
  paletteStyle: 'square' | 'triangle' | 'circle' | 'diamond'
}) {
  const paletteName = fetchedData?.paletteTitle
  const paletteTypeFullName = getPaletteType(paletteType)
  return (
    <div className="palette-display">
      <h2 className="palette-name">{paletteName}</h2>
      <div className="circle-container">
        <Circle type="default" />
      </div>
      <div className="flex gap-02">
        <p className="palette-type">{paletteTypeFullName}</p>
        {/* <SwatchesIcon size={20} color="#777" weight="fill" />
        <p className="palette-style">{paletteStyle}</p> */}
      </div>
    </div>
  )
}
