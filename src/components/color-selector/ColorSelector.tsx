import React from 'react'
import { HexColorPicker } from 'react-colorful'
import './color-selector.css'
import { useCurrentColor } from '../../hooks/useCurrentColor'

export function ColorSelector({palettes, setColor}: {palettes: any, setColor: React.Dispatch<React.SetStateAction<string>>}) {
   const currentColor = useCurrentColor(palettes)
    const color = currentColor.hex
   
    return (
        <HexColorPicker color={color} onChange={setColor} />
    )
    }