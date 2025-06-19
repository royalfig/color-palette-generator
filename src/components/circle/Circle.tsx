// To use GSAP with React, install both:
// npm install gsap @gsap/react
import { useContext, useRef, use } from 'react'
import { BaseColorData } from '../../util/factory'
import { ColorContext } from '../ColorContext'
import './circle.css'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
gsap.registerPlugin(useGSAP)

function getCirclePosition(color: BaseColorData, idx: number, type: 'default' | 'circle') {
  const [hue, saturation, lightness] = color.conversions.hsl.coords
  if (type !== 'circle') {
    const h = Number(hue.toFixed(2))
    const s = saturation > 100 ? 100 : saturation
    const l = lightness
    const hRadians = (h * Math.PI) / 180
    const sRadians = s
    const x = sRadians * Math.sin(hRadians)
    const y = sRadians * Math.cos(hRadians)
    const xr = isNaN(x) ? 0 : x
    const yr = isNaN(y) ? 0 : y * -1
    return {
      cx: xr,
      cy: yr,
      h,
      s,
      l,
      lightness,
      hue,
      saturation,
    }
  } else {
    const h = (idx + 10) * 36
    const s = saturation
    const l = lightness
    const hRadians = (h * Math.PI) / 180
    const sRadians = 50
    const x = sRadians * Math.sin(hRadians)
    const y = sRadians * Math.cos(hRadians)
    const xr = isNaN(x) ? 0 : x
    const yr = isNaN(y) ? 0 : y * -1
    return {
      cx: xr,
      cy: yr,
      h,
      s,
      saturation,
      hue,
      lightness,
      l,
    }
  }
}

function getElevationFilter(l: number) {
  if (l < 25) return 'url(#shadow-elevation-1)'
  if (l < 50) return 'url(#shadow-elevation-2)'
  if (l < 75) return 'url(#shadow-elevation-3)'
  return 'url(#shadow-elevation-4)'
}

export function Circle({ type = 'default' }: { type: 'default' | 'circle' }) {
  const context = use(ColorContext)
  const palette = context.palette

  // Sort palette by lightness (HSL L value) without mutating original
  const sortedPalette = [...palette].sort((a, b) => a.conversions.hsl.coords[2] - b.conversions.hsl.coords[2])

  const paletteValues = sortedPalette.map((color, idx) => getCirclePosition(color, idx, type))

  // Refs for each circle
  const circleContainerRef = useRef<HTMLDivElement>(null)
  const circlesRef = useRef<(SVGCircleElement | null)[]>([])
  // Store previous palette for animation
  const prevPaletteRef = useRef<BaseColorData[] | null>(null)

  useGSAP(
    () => {
      paletteValues.forEach(({ cx, cy, h, s, l, hue, saturation, lightness }, idx) => {
        gsap.to(`.circle-item:nth-child(${idx + 2})`, {
          duration: 0.7,
          ease: 'sine.out',
          attr: { cx, cy },
          '--h': hue,
          '--s': saturation,
          '--l': lightness,
        })
      })
    },
    { scope: circleContainerRef, dependencies: [sortedPalette, type] },
  )

  return (
    <div className="circle" ref={circleContainerRef}>
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

        {paletteValues.map(({ cx, cy, h, s, l, hue, saturation, lightness }, idx) => {
          console.log(hue, saturation, lightness)
          return (
            <circle
              key={idx}
              ref={el => {
                circlesRef.current[idx] = el
              }}
              cx={cx}
              cy={cy}
              r={18}
              fill="hsl(var(--h) var(--s) var(--l))"
              filter={getElevationFilter(l)}
              className="circle-item"
              style={{ '--h': hue, '--s': saturation, '--l': lightness } as React.CSSProperties}
            ></circle>
          )
        })}
      </svg>
    </div>
  )
}
