import './palette-style-selector.css'
import Button from '../button/Button'
import { Dispatch, SetStateAction } from 'react'

import { CalculatorIcon, LogIcon, OrangeSliceIcon, VolleyballIcon } from '@phosphor-icons/react'

const paletteStyleOptions = ['mathematical', 'optical', 'adaptive', 'warm-cool'] as const

const paletteStyleIcons = {
  mathematical: CalculatorIcon,
  optical: LogIcon,
  adaptive: VolleyballIcon,
  'warm-cool': OrangeSliceIcon,
}

export function PaletteStyleSelector({
  paletteStyle,
  setPaletteStyle,
}: {
  paletteStyle: (typeof paletteStyleOptions)[number]
  setPaletteStyle: Dispatch<SetStateAction<(typeof paletteStyleOptions)[number]>>
}) {
  return (
    <div className="palette-style-container">
      {paletteStyleOptions.map(style => {
        const Icon = paletteStyleIcons[style]
        return (
          <Button key={style} handler={() => setPaletteStyle(style)} active={paletteStyle === style}>
            <Icon size={20} color="url(#gradient)">
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--icon-gradient-top)" />
                  <stop offset="50%" stopColor="var(--icon-gradient-center)" />
                  <stop offset="100%" stopColor="var(--icon-gradient-top)" />
                </linearGradient>
              </defs>
            </Icon>
          </Button>
        )
      })}
    </div>
  )
}
