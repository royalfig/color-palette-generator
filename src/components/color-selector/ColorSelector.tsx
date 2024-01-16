import Color from 'colorjs.io'
import React from 'react'
import { HexColorPicker } from 'react-colorful'
import { useBaseColor } from '../../hooks/useBaseColor'
import './color-selector.css'

export function ColorSelector({
  palettes,
  setColor,
}: {
  palettes: any
  setColor: React.Dispatch<React.SetStateAction<string | Color>>
}) {
  const currentColor = useBaseColor(palettes)
  const color = currentColor.hex.string

  return <HexColorPicker color={color} onChange={setColor} />
}
