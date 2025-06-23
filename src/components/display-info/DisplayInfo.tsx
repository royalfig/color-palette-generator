import { useMemo, useContext } from 'react'
import { CheckIcon, CircleHalfIcon, DotsNineIcon, EyeIcon, InfoIcon, MonitorIcon, XIcon } from '@phosphor-icons/react'
import styles from './display-info.module.css'
import { MessageContext, MessageType } from '../MessageContext'

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

function IconSelector({ messageType }: { messageType: MessageType }) {
  switch (messageType) {
    case 'success':
      return <CheckIcon weight="fill" />
    case 'error':
      return <XIcon weight="fill" />
    case 'info':
      return <InfoIcon weight="fill" />
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

  if (message) {
    return (
      <div className={`${styles.container} ${styles[messageType || 'info']}`}>
        <IconSelector messageType={messageType || 'info'} />
        <p>{message}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className="flex gap-01">
        <MonitorIcon weight="fill" />
        {colorGamut}
      </div>
      <div className="flex gap-01">
        <EyeIcon weight="fill" />
        {gamutCoverage[colorGamut]}%
      </div>

      <div className="flex gap-01">
        <CircleHalfIcon weight="fill" />
        {dynamicRangeMap[dynamicRange]}
      </div>
      <div className="flex gap-01">
        <DotsNineIcon weight="fill" />

        {dpr}
      </div>
    </div>
  )
}
