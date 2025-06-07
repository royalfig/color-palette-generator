import { motion } from 'framer-motion'
import { Palettes } from '../../types'
import './vibrancy_module.css'

export function VibrancyModule({ palettes }: { palettes: Palettes }) {
  const width = 80 // Width of the SVG
  const height = 20 // Height of the SVG

  let saturation: number
  let lightness: number

  const hues = palettes.pol.og.map((color, idx: number) => {
    if (idx === 0) {
      saturation = color.hsl.raw[1]
      lightness = color.hsl.raw[2]
    }

    return isNaN(color.hsl.raw[0]) ? 0 : color.hsl.raw[0] % 360
  })

  const step = width / (hues.length - 1)

  // Helper to get point coordinates
  const getPoint = (i: number) => [i * step, height - (height * (isNaN(hues[i]) ? 0 : hues[i])) / 360]

  // Catmull-Rom to Bezier conversion for rolling hills
  const generatePathD = (hues: number[]) => {
    if (hues.length < 2) return ''

    let d = ''
    const points = hues.map((_, i) => getPoint(i))
    d += `M${points[0][0]},${points[0][1]}`

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2] || p2

      // Catmull-Rom to Bezier
      const control1x = p1[0] + (p2[0] - p0[0]) / 6
      const control1y = p1[1] + (p2[1] - p0[1]) / 6
      const control2x = p2[0] - (p3[0] - p1[0]) / 6
      const control2y = p2[1] - (p3[1] - p1[1]) / 6

      d += ` C${control1x},${control1y} ${control2x},${control2y} ${p2[0]},${p2[1]}`
    }

    // Close the path to fill the area under the curve
    d += ` L${width},${height}`
    d += ` L0,${height}`
    d += ' Z'
    return d
  }

  const pathD = generatePathD(hues)
  return (
    <svg className="vibrancy-module relative" width={width} height={height}>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          {hues.map((hue: number, index: number) => (
            <stop
              offset={`${(index / (hues.length - 1)) * 100}%`}
              stopColor={`hsl(${hue}, ${saturation}%, ${lightness}%)`}
              key={index}
            />
          ))}
        </linearGradient>
        <linearGradient id="black-to-transparent" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="black" stopOpacity="0.7" />
          <stop offset="40%" stopColor="black" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={pathD}
        stroke="url(#gradient)"
        strokeWidth="2"
        fill="url(#gradient)"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ d: pathD }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="url(#black-to-transparent)"
        style={{ pointerEvents: 'none' }}
      />
    </svg>
  )
}
