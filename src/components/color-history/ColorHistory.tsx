import { useContext, useEffect, useState } from 'react'
import { ColorContext } from '../ColorContext'

export function ColorHistory({ setColor }: { setColor: React.Dispatch<React.SetStateAction<string>> }) {
  const [colorHistory, setColorHistory] = useState([])
  const palette = useContext(ColorContext)
  useEffect(() => {
    const colorHistory = localStorage.getItem('color-history')
    if (colorHistory) {
      const colorHistoryArray = JSON.parse(colorHistory).reverse()
      setColorHistory(colorHistoryArray)
    }
  }, [palette])

  return (
    <div>
      {colorHistory.map((color, idx) => (
        <button
          key={idx}
          className="color-history-item"
          style={{ backgroundColor: color }}
          onClick={() => setColor(color)}
        ></button>
      ))}
    </div>
  )
}
