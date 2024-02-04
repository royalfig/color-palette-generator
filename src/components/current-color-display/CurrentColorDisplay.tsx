import { useEffect, useState } from 'react'
import { ShareIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import './current-color-display.css'
import { useBaseColor } from '../../hooks/useBaseColor'
import { useFetchColorNames } from '../../hooks/useColorName'

export function CurrentColorDisplay({
  base,
  baseColorName,
  setBaseColorName,
}: {
  base: any
  baseColorName: string
  setBaseColorName: React.Dispatch<React.SetStateAction<string>>
}) {

  const color = base.hex.string
  const { fetchedData, isLoading, error } = useFetchColorNames(color)
  console.log("🚀 ~ fetchedData, isLoading, error:", fetchedData, isLoading, error)
  !isLoading && fetchedData && setBaseColorName(fetchedData.colorNames[0])

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
