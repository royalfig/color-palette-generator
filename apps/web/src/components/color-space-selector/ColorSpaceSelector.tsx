import { ColorSpace, ColorFormat } from '../../types'
import Button from '../button/Button'
import './color-space-selector.css'

type ColorSpaceOption = {
  label: string
  space: ColorSpace
  format: ColorFormat
}

const COLOR_SPACE_OPTIONS: ColorSpaceOption[] = [
  { label: 'OKLCH', space: 'oklch', format: 'oklch' },
  { label: 'LCH', space: 'lch', format: 'lch' },
  { label: 'OKLAB', space: 'oklab', format: 'oklab' },
  { label: 'LAB', space: 'lab', format: 'lab' },
  { label: 'P3', space: 'p3', format: 'p3' },
  { label: 'HSL', space: 'hsl', format: 'hsl' },
  { label: 'RGB', space: 'srgb', format: 'rgb' },
  { label: 'HEX', space: 'srgb', format: 'hex' },
]

export function ColorSpaceSelector({
  colorSpace,
  setColorSpace,
}: {
  colorSpace: { space: ColorSpace; format: ColorFormat }
  setColorSpace: (colorSpace: { space: ColorSpace; format: ColorFormat }) => void
}) {
  return (
    <div className="color-space-selector">
      <div className="color-space-selector-header">
        <div className="divider"></div>
        <p>Color Space</p>
        <div className="divider"></div>
      </div>
      <div className="color-space-selector-buttons">
        {COLOR_SPACE_OPTIONS.map(option => (
          <Button
            key={option.label}
            handler={() => setColorSpace({ space: option.space, format: option.format })}
            active={colorSpace.space === option.space && colorSpace.format === option.format}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
