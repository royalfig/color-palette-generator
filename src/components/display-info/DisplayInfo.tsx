import { useMemo, useContext } from 'react'
import {
  CheckSquareIcon,
  CheckIcon,
  CircleHalfIcon,
  DotsNineIcon,
  EyeIcon,
  InfoIcon,
  MonitorIcon,
  XIcon,
} from '@phosphor-icons/react'
import './display-info.css'
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

function IconSelector({ size, messageType }: { size: number; messageType: MessageType }) {
  switch (messageType) {
    case 'success':
      return <CheckSquareIcon weight="bold" size={size} />
    case 'error':
      return <XIcon weight="bold" size={size} />
    case 'info':
      return <InfoIcon weight="bold" size={size} />
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
      <div className={`display-info-container display-info-${messageType || 'info'} display-info-message`}>
        <IconSelector size={20} messageType={messageType || 'info'} />
        <p>{message}</p>
      </div>
    )
  }

  return (
    <div className="display-info-container">
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
