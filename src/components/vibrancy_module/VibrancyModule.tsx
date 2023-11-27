import { motion } from 'framer-motion'
import './vibrancy_module.css'
import { Schemes } from '../../util/palettes'

export function VibrancyModule({ palettes }: { palettes: Schemes }) {
  const width = 80 // Width of the SVG
  const height = 20 // Height of the SVG

  let saturation: number
  let lightness: number

  const hues = palettes.polychromia.original.map((color, idx: number) => {
    if (idx === 0) {
      saturation = color.hsl.raw[1]
      lightness = color.hsl.raw[2]
    }

    return isNaN(color.hsl.raw[0]) ? 0 : color.hsl.raw[0] % 360
  })

  const step = width / (hues.length - 1)

  const generatePathD = (hues: number[]) => {
    if (hues.length < 2) return ''

    const firstHue = isNaN(hues[0]) ? 0 : hues[0]
    let pathD = `M0,${height - (height * firstHue) / 360}`

    for (let i = 0; i < hues.length - 1; i++) {
      const startX = i * step
      const startY = height - (height * (isNaN(hues[i]) ? 0 : hues[i])) / 360
      const endX = (i + 1) * step
      const endY = height - (height * (isNaN(hues[i + 1]) ? 0 : hues[i + 1])) / 360
      const controlX1 = (startX + endX) / 2
      const controlY1 = (startY + endY) / 2 // Adjust for a smoother curve
      const controlX2 = (startX + endX) / 2
      const controlY2 = (startY + endY) / 2 // Adjust for a smoother curve

      pathD += ` C${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`
    }

    return pathD
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
      </defs>
      <motion.path
        d={pathD}
        stroke="url(#gradient)" 
        strokeWidth="2"   
        fill="none"
        initial={false}
        animate={{ d: pathD }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />
    </svg>
  )
}
