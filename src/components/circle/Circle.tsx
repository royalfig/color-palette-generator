import { use } from 'react'
import { BaseColorData } from '../../util/factory'
import { ColorContext } from '../ColorContext'
import { motion } from 'motion/react'
import './circle.css'

function getCirclePosition(color: BaseColorData, idx: number, type: 'default' | 'circle') {
  const [hue, saturation, lightness] = color.conversions.hsl.value.match(/\d+(?:\.\d+)?/g)?.map(Number) || [0, 0, 0]
  console.log(hue, saturation, lightness)
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

        {/* Background circle */}
        <circle cx="0" cy="0" r={100} fill="none" stroke="var(--dimmed)" strokeWidth="4" />

        {/* Animated color circles */}
        {paletteValues.map(({ cx, cy, l, hue, saturation, lightness }, idx) => (
          <motion.circle
            key={`circle-${idx}`}
            animate={{
              cx,
              cy,
              fill: `hsl(${hue} ${saturation} ${lightness})`,
            }}
            transition={{
              duration: 0.25,
              ease: 'easeOut',
              type: 'tween', // Use tween instead of spring for consistent timing
            }}
            initial={false} // Don't animate on mount
            r={18}
            filter={getElevationFilter(l)}
            className="circle-item"
          />
        ))}
      </svg>
    </div>
  )
}
