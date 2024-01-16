import Color from 'colorjs.io'
import { useState } from 'react'
import { Schemes } from '../../util/palettes'
import { InputColor } from '../input-color/InputColor'
import { InputTypeSelector } from '../input-text-type-selector/InputTypeSelector'
import { ColorFactory } from '../../util/factory'

export type ColorTypes = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3';

export function InputColorContainer({
  palettes,
  setColor,
  base
}: {
  palettes: Schemes
  setColor: React.Dispatch<React.SetStateAction<string | Color>>,
  base: ColorFactory
}) {
  const [colorspaceType, setColorspaceType] = useState<ColorTypes>('hex')

  return (
    <div className="input-color-container">
      <InputColor setColorspaceType={setColorspaceType} setColor={setColor} type={colorspaceType} base={base} />
      <InputTypeSelector setColorSpace={setColorspaceType} current={colorspaceType} />
    </div>
  )
}
