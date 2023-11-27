import { useState } from 'react'
import { Schemes } from '../../util/palettes'
import './color-history.css'

export default function ColorHistory({ palettes, setColor }: { palettes: Schemes; setColor: Function }) {
  const [history, setHistory] = useState(Array(7).fill(''))
  const [prev, setPrev] = useState({} as object)

  if (prev.complementary?.original?.[0].hex?.string !== palettes.complementary?.original?.[0].hex?.string) {
    let newHistory = [...history]
    newHistory.unshift(palettes.complementary.original[0])
    newHistory = newHistory.slice(0, 7)
    setHistory(newHistory)
    setPrev(palettes)
  }

  return (
    <section className="color-history">
      <p>History</p>
      {history.map((color, idx) => (
        <button
          key={idx}
          className="color-history-item"
          disabled={color === '' ? true : false}
          aria-label={`Set history color to ${color.hex?.string}`}
          onClick={() => {
            setColor(color.hex.base)
          }}
        >
          <div className="color-history-swatch" style={{ backgroundColor: color.hex?.string }}></div>
        </button>
      ))}
    </section>
  )
}
