import Color from 'colorjs.io'
import React from 'react'
import { HexColorPicker } from 'react-colorful'
import { useCurrentColor } from '../../hooks/useCurrentColor'
import './color-selector.css'

export function ColorSelector({
  palettes,
  setColor,
}: {
  palettes: any
  setColor: React.Dispatch<React.SetStateAction<string | Color>>
}) {
  const currentColor = useCurrentColor(palettes)
  const color = currentColor

  return <HexColorPicker color={color} onChange={setColor} />
}
