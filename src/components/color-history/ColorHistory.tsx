import { useState } from 'react'
import { useBaseColor } from '../../hooks/useBaseColor'
import { Schemes } from '../../util/palettes'
import './color-history.css'

export default function ColorHistory({ palettes, setColor, colorSpace }: { palettes: Schemes; setColor: Function }) {
  const { hex } = useBaseColor(palettes)
  
  const [prev, setPrev] = useState(hex.string)
  const [history, setHistory] = useState(Array(5).fill(''))
  
  if (hex.string !== prev) {
    setHistory([prev, ...history.slice(0, 4)])
    setPrev(hex.string)
  }
    
    
  

  return (
    <>
      {history.map((color, idx) => (
        <button
          key={idx}
          className="color-history-item"
          disabled={color === '' ? true : false}
          aria-label={`Set history color to ${color}`}
          onClick={() => {
            setColor(color)
          }}
          style={{ backgroundColor: color }}
        ></button>
      ))}
    </>
  )
}
