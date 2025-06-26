import './palette-style-selector.css'
import Button from '../button/Button'
import { Dispatch, SetStateAction } from 'react'

import { CircleIcon } from '@phosphor-icons/react/dist/csr/Circle'
import { SquareIcon } from '@phosphor-icons/react/dist/csr/Square'
import { TriangleIcon } from '@phosphor-icons/react/dist/csr/Triangle'
import { DiamondIcon } from '@phosphor-icons/react/dist/csr/Diamond'

const paletteStyleOptions = ['square', 'triangle', 'circle', 'diamond'] as const

const paletteStyleIcons = {
  square: SquareIcon,
  triangle: TriangleIcon,
  circle: CircleIcon,
  diamond: DiamondIcon,
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
          <Button
            key={style}
            handler={() => setPaletteStyle(style)}
            active={paletteStyle === style}
            className="inverse"
          >
            <Icon size={18} weight="bold" fill="url(#gradient1)">
              <defs>
                <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ccc" />
                  <stop offset="50%" stopColor="#fff" />
                  <stop offset="100%" stopColor="#ccc" />
                </linearGradient>
              </defs>
            </Icon>
          </Button>
        )
      })}
    </div>
  )
}
