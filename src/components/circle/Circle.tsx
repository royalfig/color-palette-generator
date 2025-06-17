// To use GSAP with React, install both:
// npm install gsap @gsap/react
import { useContext, useRef } from 'react'
import { BaseColorData } from '../../util/factory'
import { ColorContext } from '../ColorContext'
import './circle.css'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

function getCirclePosition(color: BaseColorData, idx: number, type: 'default' | 'circle') {
  if (type !== 'circle') {
    let [h, s] = color.conversions.hsl.coords
    h = Number(h.toFixed(2))
    s = s > 100 ? 100 : s
    const hRadians = (h * Math.PI) / 180
    const sRadians = s
    const x = sRadians * Math.sin(hRadians)
    const y = sRadians * Math.cos(hRadians)
    const xr = isNaN(x) ? 0 : x
    const yr = isNaN(y) ? 0 : y * -1
    return { cx: xr, cy: yr, fill: color.string }
  } else {
    const h = (idx + 10) * 36
    const hRadians = (h * Math.PI) / 180
    const sRadians = 50
    const x = sRadians * Math.sin(hRadians)
    const y = sRadians * Math.cos(hRadians)
    const xr = isNaN(x) ? 0 : x
    const yr = isNaN(y) ? 0 : y * -1
    return { cx: xr, cy: yr, fill: color.string }
  }
}

function getElevationFilter(l: number) {
  if (l < 25) return 'url(#shadow-elevation-1)'
  if (l < 50) return 'url(#shadow-elevation-2)'
  if (l < 75) return 'url(#shadow-elevation-3)'
  return 'url(#shadow-elevation-4)'
}

export function Circle({ type = 'default' }: { type: 'default' | 'circle' }) {
  const context = useContext(ColorContext)
  const palette = context?.palette

  // Refs for each circle
  const circlesRef = useRef<(SVGCircleElement | null)[]>([])
  // Store previous palette for animation
  const prevPaletteRef = useRef<BaseColorData[] | null>(null)

  useGSAP(
    () => {
      if (!palette) return
      palette.forEach((color: BaseColorData, idx: number) => {
        const circle = circlesRef.current[idx]
        if (!circle) return
        // Get previous and new positions/colors
        const prevPalette = prevPaletteRef.current
        let from = { cx: 0, cy: 0, fill: color.string }
        if (prevPalette && prevPalette[idx]) {
          from = getCirclePosition(prevPalette[idx], idx, type)
        } else {
          // Animate in from center if no previous
          from = { cx: 0, cy: 0, fill: color.string }
        }
        const to = getCirclePosition(color, idx, type)
        // Set initial state
        gsap.set(circle, { attr: from })
        // Animate to new state
        gsap.to(circle, {
          duration: 0.7,
          attr: to,
          ease: 'power2.inOut',
        })
      })
      // Update previous palette
      prevPaletteRef.current = palette.map(c => ({ ...c }))
    },
    { dependencies: [palette, type] },
  )

  if (!palette) return null

  return (
    <div className="circle">
      <svg viewBox="-120 -120 240 240">
        <defs>
          <filter id="shadow-elevation-1" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.25" />
          </filter>
          <filter id="shadow-elevation-2" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35" />
          </filter>
          <filter id="shadow-elevation-3" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.45" />
          </filter>
          <filter id="shadow-elevation-4" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>
        <circle cx="0" cy="0" r={100} fill="none" stroke="var(--dimmed)" strokeWidth="4" />

        {palette.map((color: BaseColorData, idx: number) => {
          const { cx, cy, fill } = getCirclePosition(color, idx, type)
          const l = color.conversions.hsl.coords[2]
          return (
            <circle
              key={idx}
              ref={el => {
                circlesRef.current[idx] = el
              }}
              cx={cx}
              cy={cy}
              r={18}
              fill={fill}
              filter={getElevationFilter(l)}
            ></circle>
          )
        })}
      </svg>
    </div>
  )
}
