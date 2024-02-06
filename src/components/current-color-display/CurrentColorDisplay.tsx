import { useEffect, useState } from 'react'
import { ShareIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import './current-color-display.css'
import { ColorName } from '../../App'

export function CurrentColorDisplay({
  base,
  colorName,
}: {
  base: any
  colorName: ColorName
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
      <button className="color-share-icon" aria-label="Share or save color by copying the URL" style={{ color: color }}>
        <ShareIcon className="icon" />
      </button>
    </div>
  )
}
