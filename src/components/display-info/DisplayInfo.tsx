import { useMemo, useContext } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import './display-info.css'
import { MessageContext, MessageType } from '../MessageContext'
import { InfoIcon as InfoIconDist } from '@phosphor-icons/react/dist/csr/Info'
import { CheckSquareIcon } from '@phosphor-icons/react/dist/csr/CheckSquare'
import { XIcon } from '@phosphor-icons/react/dist/csr/X'
import { MonitorIcon } from '@phosphor-icons/react/dist/csr/Monitor'
import { EyeIcon } from '@phosphor-icons/react/dist/csr/Eye'
import { CircleHalfIcon } from '@phosphor-icons/react/dist/csr/CircleHalf'

export function useDisplayCapabilities() {
  const capabilities = useMemo(() => {
    // Test color gamut
    let gamut = 'srgb' // default
    if (window.matchMedia('(color-gamut: rec2020)').matches) {
      gamut = 'rec2020'
    } else if (window.matchMedia('(color-gamut: p3)').matches) {
      gamut = 'p3'
    }

    const dpr = window.devicePixelRatio

    // Test dynamic range
    const hasHDR = window.matchMedia('(dynamic-range: high)').matches

    return {
      colorGamut: gamut,
      dynamicRange: hasHDR ? 'high' : 'standard',
      dpr,
    }
  }, []) // Empty dependency array - only run once

  return capabilities
}

function IconSelector({ size, messageType }: { size: number; messageType: MessageType }) {
  switch (messageType) {
    case 'success':
      return <CheckSquareIcon weight="bold" size={size} />
    case 'error':
      return <XIcon weight="bold" size={size} />
    case 'info':
      return <InfoIconDist weight="bold" size={size} />
  }
}

// Usage in component
export function DisplayInfo() {
  const { colorGamut, dynamicRange, dpr } = useDisplayCapabilities()
  const { message, messageType } = useContext(MessageContext)

  // Mapping from color gamut to human spectrum coverage
  const gamutCoverage: Record<string, number> = {
    srgb: 35,
    p3: 45,
    rec2020: 63,
    unknown: 0,
  }

  const dynamicRangeMap: Record<string, string> = {
    high: 'HDR',
    standard: 'SDR',
    unknown: 'Unknown',
  }

  return (
    <div className="display-info-container">
      <AnimatePresence mode="wait" initial={false}>
        {message ? (
          <motion.div
            key="message"
            className={`display-info-${messageType || 'info'} display-info-message`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <IconSelector size={20} messageType={messageType || 'info'} />
            <p>{message}</p>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            className="display-info-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex gap-01">
              <MonitorIcon weight="fill" size={14} />
              <p>{colorGamut}</p>
            </div>
            <div className="flex gap-01">
              <EyeIcon weight="fill" size={14} />
              <p>{gamutCoverage[colorGamut]}%</p>
            </div>
            <div className="flex gap-01">
              <CircleHalfIcon weight="fill" size={14} />
              <p>{dynamicRangeMap[dynamicRange]}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
