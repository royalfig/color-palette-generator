import { motion } from 'framer-motion'
import { ColorName } from '../../App'
import ColorHistory from '../color-history/ColorHistory'
import './current-color-display.css'

export function CurrentColorDisplay({
  base,
  colorName,
  palettes,
  setColor,
}: {
  base: any
  colorName: ColorName,
  palettes: any,
  setColor: Function
}) {

  // TODO: use current color space
  const color = base.hex.string


  const baseColorName = colorName.isLoading ? 'Loading...' : colorName.fetchedData?.colorNames[0]


  return (
    <div className="current-color-display flex">
      <div className="name-group flex">
        <div className="color-dot relative" style={{ backgroundColor: color }}></div>
        <motion.p
          className="color-name"
          key={baseColorName}
          initial={{ clipPath: 'inset(0 100% 0 0)' }} // Hides text initially
          animate={{ clipPath: 'inset(0 0 0 0)' }} // Reveals text
          exit={{ clipPath: 'inset(0 100% 0 0)' }} // Hides text again
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {baseColorName}
        </motion.p>
      </div>
      <div className="flex color-history-group">
        <ColorHistory palettes={palettes} setColor={setColor} />
      </div>
    </div>
  )
}
