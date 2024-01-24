import Color from 'colorjs.io'
import { useState } from 'react'
import { Schemes } from '../../util/palettes'
import { InputColor } from '../input-color/InputColor'
import { InputTypeSelector } from '../input-text-type-selector/InputTypeSelector'
import { ColorFactory } from '../../util/factory'
import { ColorTypes } from '../../App'
import './input-color-container.css'

export function InputColorContainer({
  palettes,
  setColor,
  base,
  setColorspaceType,
  colorspaceType,
}: {
  palettes: Schemes
  setColor: React.Dispatch<React.SetStateAction<string | Color>>
  base: ColorFactory
  setColorspaceType: React.Dispatch<React.SetStateAction<ColorTypes>>
  colorspaceType: ColorTypes
}) {
  return (
    <div className="input-color-container">
      <InputColor setColorspaceType={setColorspaceType} setColor={setColor} type={colorspaceType} base={base} />
    </div>
  )
}
