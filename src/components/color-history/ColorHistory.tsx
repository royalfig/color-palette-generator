import { useContext, useEffect, useState } from 'react'
import { ColorContext } from '../ColorContext'
import '../swatches/swatches.css'

export function ColorHistory({
  setColor,
  colorHistory,
  setColorHistory,
}: {
  setColor: React.Dispatch<React.SetStateAction<string>>
  colorHistory: string[]
  setColorHistory: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const totalSquares = 240
  const columns = 24
  const rows = 10
  // Show most recent colors at the beginning
  const paddedHistory = colorHistory.concat(Array(totalSquares - colorHistory.length).fill(null))

  const handleClick = (color: string | null) => {
    if (color) setColor(color)
  }

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>, color: string | null) => {
    if (color) {
      e.preventDefault()
      setColorHistory(prev => {
        const updated = prev.filter(c => c !== color)
        localStorage.setItem('color-history', JSON.stringify(updated))
        return updated
      })
    }
  }

  return (
    <div className="swatch-container" style={{ '--columns': columns, '--rows': rows } as React.CSSProperties}>
      {paddedHistory.map((color, i) => (
        <div
          key={i}
          className="swatch"
          style={{ backgroundColor: color || 'var(--dimmed)', cursor: color ? 'pointer' : 'default' }}
          onClick={() => handleClick(color)}
          onContextMenu={e => handleRightClick(e, color)}
          data-color={color || undefined}
        />
      ))}
    </div>
  )
}
