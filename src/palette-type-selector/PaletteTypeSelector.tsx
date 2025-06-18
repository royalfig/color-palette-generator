import classes from './palette-type-selector.module.css'
import { PaletteKinds } from '../types'
import Button from '../components/button/Button'

const paletteTypeOptions = ['ana', 'com', 'spl', 'tri', 'tet', 'tas'] as const

export function PaletteTypeSelector({
  paletteType,
  setPaletteType,
}: {
  paletteType: PaletteKinds
  setPaletteType: Function
}) {
  return (
    <div className={classes.container}>
      <div className="color-space-selector-header">
        <div className="divider"></div>
        <p>Palette Type</p>
        <div className="divider"></div>
      </div>
      <div className={classes.buttons}>
        {paletteTypeOptions.map(option => (
          <Button key={option} handler={() => setPaletteType(option)} active={paletteType === option}>
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}
