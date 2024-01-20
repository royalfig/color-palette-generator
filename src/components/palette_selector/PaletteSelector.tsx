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
  return (
    <div className="palette-selector-container">
      {Object.entries(palettes).map(([key, value]) => {
        return (
          <button
            key={key}
            onClick={() => setPalette(key)}
            className={palette === key ? `active palette-selector` : `palette-selector`}
          >
            {['tones', 'tints', 'poly'].includes(key) ? (
              <Circle colors={value} type="circle" size="small" />
            ) : (
              <Circle colors={value} type="default" size="small" />
            )}
            <p>{key}</p>
          </button>
        )
      })}
    </div>
  )
}
