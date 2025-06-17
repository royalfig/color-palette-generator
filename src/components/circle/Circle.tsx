import { useContext } from 'react'
import { BaseColorData } from '../../util/factory'
import { ColorContext } from '../ColorContext'
import './circle.css'

export function Circle({ type = 'default' }: { type: 'default' | 'circle' }) {
  const context = useContext(ColorContext)
  const palette = context?.palette

  if (!palette) return null

  return (
    <div className="circle">
      <svg viewBox="-120 -120 240 240">
        <circle cx="0" cy="0" r={100} fill="none" stroke="var(--dimmed)" strokeWidth="4" />
        {type !== 'circle'
          ? palette.map((color: BaseColorData, idx: number) => {
              let [h, s, l] = color.conversions.hsl.coords

              h = Number(h.toFixed(2))

              s = s > 100 ? 100 : s
              const hRadians = (h * Math.PI) / 180
              const sRadians = s

              const x = sRadians * Math.sin(hRadians)
              const y = sRadians * Math.cos(hRadians)

              const xr = isNaN(x) ? 0 : x
              const yr = isNaN(y) ? 0 : y * -1
              return <circle key={idx} cx={xr} cy={yr} r={18} fill={color.string}></circle>
            })
          : palette.map((color: any, idx: number) => {
              const h = (idx + 10) * 36

              const hRadians = (h * Math.PI) / 180
              const sRadians = 50

              const x = sRadians * Math.sin(hRadians)
              const y = sRadians * Math.cos(hRadians)

              const xr = isNaN(x) ? 0 : x
              const yr = isNaN(y) ? 0 : y * -1
              return <circle key={idx} cx={xr} cy={yr} r={18} fill={color.string}></circle>
            })}
      </svg>
    </div>
  )
}
