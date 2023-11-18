import React from 'react'
import { HexColorPicker } from 'react-colorful'
import './color-selector.css'

export function ColorSelector({color, setColor}: {color: string, setColor: React.Dispatch<React.SetStateAction<string>>}) {
    return (
        <HexColorPicker color={color} onChange={setColor} />
    )
    }