import { motion } from 'framer-motion'
import './vibrancy_module.css'

export function VibrancyModule({ palettes }) {
  const width = 80 // Width of the SVG
  const height = 20 // Height of the SVG

  let saturation: string
  let lightness: string

  const hues = palettes.polychromia.original.map((color: { point: number[]; cssRaw: string }, idx: number) => {
    if (idx === 0) {
      const [h, s, l] = color.cssRaw.split(' ')

      saturation = s
      lightness = l
    }
    console.log(color)
    return color.point[0] % 360
  })
  const step = width / (hues.length - 1)

  const generatePathD = (hues: number[]) => {
    let pathD = `M0,${height - (height * hues[0]) / 360}`
    hues.forEach((hue, index) => {
      const x = index * step
      const y = height - (height * hue) / 360
      pathD += ` L${x},${y}`
    })
    pathD += ` L${width},${height} L0,${height}`
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
              stopColor={`hsl(${hue}, ${saturation}, ${lightness})`}
              key={index}
            />
          ))}
        </linearGradient>
      </defs>
      <motion.path
        d={pathD}
        fill="url(#gradient)"
        initial={false}
        animate={{ d: pathD }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />
    </svg>
  )
}
