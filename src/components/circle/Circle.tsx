import { use, useMemo, useRef, useEffect } from 'react'
import { BaseColorData } from '../../util/factory'
import { ColorContext } from '../ColorContext'
import { useReducedMotion } from 'motion/react'
import './circle.css'

function getCirclePosition(color: BaseColorData, idx: number, type: 'default' | 'circle') {
  const [hue, saturation, lightness] = color.conversions.hsl.value.match(/\d+(?:\.\d+)?/g)?.map(Number) || [0, 0, 0]
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
  const shouldReduceMotion = useReducedMotion()
  const svgRef = useRef<SVGSVGElement>(null)
  const previousPaletteKeyRef = useRef<string>('')

  // Memoize sorted palette and positions to avoid recalculation
  const sortedPalette = useMemo(
    () => [...palette].sort((a, b) => a.conversions.hsl.coords[2] - b.conversions.hsl.coords[2]),
    [palette],
  )

  const paletteValues = useMemo(
    () => sortedPalette.map((color, idx) => ({
      ...getCirclePosition(color, idx, type),
      fill: sortedPalette[idx].cssValue,
      filter: getElevationFilter(getCirclePosition(color, idx, type).l),
    })),
    [sortedPalette, type],
  )

   const paletteKey = useMemo(
    () => `${type}:${sortedPalette.map(p => p.cssValue).join('|')}`,
    [sortedPalette, type],
  )
  
  // High-performance CSS transition approach for SVG circles
  // Modern browsers support CSS transitions on SVG attributes (cx, cy, fill)
  useEffect(() => {
    if (!svgRef.current || paletteKey === previousPaletteKeyRef.current) return

    previousPaletteKeyRef.current = paletteKey

    const svg = svgRef.current
    const circles = Array.from(svg.querySelectorAll('.circle-item')) as SVGCircleElement[]

    if (shouldReduceMotion) {
      // Instant update for reduced motion
      circles.forEach((circle, idx) => {
        const { cx, cy, fill } = paletteValues[idx]
        circle.setAttribute('cx', String(cx))
        circle.setAttribute('cy', String(cy))
        circle.setAttribute('fill', fill)
      })
      return
    }

    // Batch all DOM reads first
    const updates: Array<{ circle: SVGCircleElement; cx: number; cy: number; fill: string }> = []
    circles.forEach((circle, idx) => {
      const { cx, cy, fill } = paletteValues[idx]
      updates.push({ circle, cx, cy, fill })
    })

    // Use double RAF to ensure transitions are set before attribute changes
    requestAnimationFrame(() => {
      // First frame: Set all transitions
      // Modern browsers support CSS transitions on SVG attributes
      updates.forEach(({ circle }) => {
        circle.style.transition = 'cx 0.25s ease-out, cy 0.25s ease-out, fill 0.25s ease-out'
      })

      // Second frame: Trigger transitions by updating attributes
      requestAnimationFrame(() => {
        updates.forEach(({ circle, cx, cy, fill }) => {
          circle.setAttribute('cx', String(cx))
          circle.setAttribute('cy', String(cy))
          circle.setAttribute('fill', fill)
        })
      })
    })
  }, [paletteKey, paletteValues, shouldReduceMotion])

  return (
    <div className="circle">
      <svg ref={svgRef} viewBox="-120 -120 240 240">
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
        {/* Using CSS transitions for SVG attributes - much more performant than JS animations */}
        {paletteValues.map(({ cx, cy, fill, filter }, idx) => (
          <circle
            key={`circle-${idx}`}
            className="circle-item"
            cx={cx}
            cy={cy}
            fill={fill}
            filter={filter}
            r={18}
          />
        ))}
      </svg>
    </div>
  )
}
