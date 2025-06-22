import { useState, useEffect } from 'react'
import { CircleHalfIcon, DotsNineIcon, EyeIcon, MonitorIcon } from '@phosphor-icons/react'
import { container } from './display-info.module.css'

export function useDisplayCapabilities() {
  const [capabilities, setCapabilities] = useState({
    colorGamut: 'unknown',
    dynamicRange: 'unknown',
    dpr: 1,
    loading: true,
  })

  useEffect(() => {
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

    setCapabilities({
      colorGamut: gamut,
      dynamicRange: hasHDR ? 'high' : 'standard',
      dpr,
      loading: false,
    })
  }, []) // Empty dependency array - only run once

  return capabilities
}

// Usage in component
export function DisplayInfo() {
  const { colorGamut, dynamicRange, loading, dpr } = useDisplayCapabilities()

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

  if (loading) return <div>Detecting display capabilities...</div>

  return (
    <div className={container}>
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
