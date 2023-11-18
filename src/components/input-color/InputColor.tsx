import { useEffect, useState } from 'react'
import './InputColor.css'

export function InputColor({
  palettes,
  setColor,
  type,
}: {
  palettes: any
  setColor: React.Dispatch<React.SetStateAction<string>>
  type: 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab'
}) {
  
  
    const [inputColor, setInputColor] = useState(palettes.complementary.original[0][type])
    
    function handleChange(value: string): void {
        setInputColor(value)
    }

    useEffect(() => {
        setInputColor(palettes.complementary.original[0][type])
    }, [palettes])

  return (
    <div className="input-color">
      <label htmlFor={`input-color-${type}`}>{type}</label>
      <input id={`input-color-${type}`} type="text" value={inputColor} onChange={e => handleChange(e.target.value)} />
    </div>
  )
}
