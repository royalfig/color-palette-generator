import { Schemes } from '../../util/palettes'
import { Circle } from '../circle/Circle'
import './PaletteSelector.css'

export default function PaletteSelector({
  palettes,
  palette,
  setPalette,
}: {
  palettes: Schemes
  palette: string
  setPalette: Function
}) {
  console.log(Object.entries(palettes))
  return (
    <div className="palette-selector-container">
      {Object.entries(palettes).map(([key, value]) => {
        return (
          <button key={key} className="palette-selector">
            {['tones', 'tints', 'polychromia'].includes(key) ? (
              <Circle colors={value} type="circle" size="small" />
            ) : (
              <Circle colors={value} type="default" size="small" />
            )}
            <p>{key}</p>
          </button>
        )
      })}

      {/* {palettes.map((colors, idx) => {
        return (
          <button key={idx} onClick={setPalette}>
            <Circle
              colors={colors}
              type={
                colors.name === 'tones' ||
                colors.name === 'tints and shades' ||
                colors.name === 'polychroma' ||
                colors.name === 'ombre'
                  ? 'circle'
                  : 'default'
              }
              size="small"
            />
            <p>{colors.name}</p>
          </button>
        )
      })} */}
    </div>
  )
}
