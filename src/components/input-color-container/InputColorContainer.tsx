import Color from 'colorjs.io'
import { Dispatch, SetStateAction } from 'react'
import { BaseColorData, ColorSpace, Palettes } from '../../types'
import { InputColor } from '../input-color/InputColor'
import './input-color-container.css'

export function InputColorContainer({
  palettes,
  setColor,
  base,
  setColorspaceType,
  colorspaceType,
  setError,
  setIsActive,
  isActive
}: {
  palettes: Palettes
  setColor: Dispatch<SetStateAction<string | Color>>
  base: BaseColorData
  setColorspaceType: React.Dispatch<React.SetStateAction<ColorSpace>>
  colorspaceType: ColorSpace
  setError: Dispatch<SetStateAction<string>>
  setIsActive: Dispatch<SetStateAction<boolean>>
  isActive: boolean
}) {
  return (
    <div className="input-color-container">
      <InputColor setColorspaceType={setColorspaceType} setColor={setColor} type={colorspaceType} base={base} setError={setError} setIsActive={setIsActive} isActive={isActive} />
    </div>
  )
}
