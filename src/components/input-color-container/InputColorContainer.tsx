import Color from 'colorjs.io'
import { useState } from 'react'
import { Schemes } from '../../util/palettes'
import { InputColor } from '../input-color/InputColor'
import { InputTypeSelector } from '../input-text-type-selector/InputTypeSelector'

type ColorTypes = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3';

export function InputColorContainer({
  palettes,
  setColor,
}: {
  palettes: Schemes
  setColor: React.Dispatch<React.SetStateAction<string | Color>>
}) {
  const [colorspaceType, setColorspaceType] = useState('hex' as ColorTypes)

  return (
    <div className="input-color-container">
      <InputColor palettes={palettes} setColor={setColor} type={colorspaceType} />
      <InputTypeSelector setColorSpace={setColorspaceType} current={colorspaceType} />
    </div>
  )
}
