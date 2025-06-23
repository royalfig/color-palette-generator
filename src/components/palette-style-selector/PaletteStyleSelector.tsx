import classes from './palette-style-selector.module.css'
import Button from '../button/Button'
import { Dispatch, SetStateAction } from 'react'

import { MathOperationsIcon } from '@phosphor-icons/react/dist/csr/MathOperations'
import { EyeIcon } from '@phosphor-icons/react/dist/csr/Eye'
import { ThermometerHotIcon } from '@phosphor-icons/react/dist/csr/ThermometerHot'
import { WaveSineIcon } from '@phosphor-icons/react/dist/csr/WaveSine'

const paletteStyleOptions = ['mathematical', 'optical', 'adaptive', 'warm-cool'] as const

const paletteStyleIcons = {
  mathematical: MathOperationsIcon,
  optical: EyeIcon,
  adaptive: WaveSineIcon,
  'warm-cool': ThermometerHotIcon,
}

export function PaletteStyleSelector({
  paletteStyle,
  setPaletteStyle,
}: {
  paletteStyle: (typeof paletteStyleOptions)[number]
  setPaletteStyle: Dispatch<SetStateAction<(typeof paletteStyleOptions)[number]>>
}) {
  return (
    <div className={classes.container}>
      {paletteStyleOptions.map(style => {
        const Icon = paletteStyleIcons[style]
        return (
          <Button
            key={style}
            className={classes.style}
            handler={() => setPaletteStyle(style)}
            active={paletteStyle === style}
          >
            <Icon size={20} weight="fill" color="url(#gradient)">
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
