import { AppWindowIcon } from '@phosphor-icons/react/dist/csr/AppWindow'
import { CirclesFourIcon } from '@phosphor-icons/react/dist/csr/CirclesFour'
import { FadersHorizontalIcon } from '@phosphor-icons/react/dist/csr/FadersHorizontal'
import { PaletteIcon } from '@phosphor-icons/react/dist/csr/Palette'
import { ScissorsIcon } from '@phosphor-icons/react/dist/csr/Scissors'
import { SwatchesIcon } from '@phosphor-icons/react/dist/csr/Swatches'
import { motion } from 'motion/react'
import { useContext } from 'react'
import { ColorFormat, ColorSpace, PaletteKinds, PaletteStyle } from '../../types'
import { ColorContext } from '../ColorContext'
import { MessageContext } from '../MessageContext'
import { PaletteDisplay } from '../palette-display/PaletteDisplay'
import './color-display.css'

function formatColorValues(values: number[] | undefined, format: string[], times100 = true) {
  if (!values) {
    return ''
  }

  return values
    .map((value, index) => {
      if (format[index] !== 'percent') {
        return value
      }

      const num = times100 ? value * 100 : value
      const formatted = parseFloat(num.toFixed(2))

      return `${formatted}%`
    })
    .join(' ')
}

function getPaletteType(paletteType: PaletteKinds) {
  switch (paletteType) {
    case 'ana':
      return 'Analogous'
    case 'com':
      return 'Complementary'
    case 'tri':
      return 'Triadic'
    case 'tet':
      return 'Tetradic'
    case 'spl':
      return 'Split Complementary'
    case 'tas':
      return 'Tints & Shades'
  }
}

export function ColorDisplay({
  fetchedData,
  isLoading,
  error,
  colorSpace,
  paletteType,
  paletteStyle,
  knobValues,
}: {
  fetchedData: { colorNames: string[]; paletteTitle: string; baseColorName: string } | null
  isLoading: boolean
  error: Error | null
  colorSpace: { space: ColorSpace; format: ColorFormat }
  paletteType: PaletteKinds
  paletteStyle: PaletteStyle
  knobValues: number[]
}) {
  const colorName = fetchedData?.baseColorName
  const context = useContext(ColorContext)
  const color = context?.originalColor
  const { lch, oklch, lab, oklab, p3, hsl, rgb, hex } = color?.conversions || {}
  const { showMessage } = useContext(MessageContext)

  const paletteTypeFull = getPaletteType(paletteType)
  const effectsEnabled = knobValues.some(value => value > 0)

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest('[data-value]')
    if (el && el instanceof HTMLElement) {
      const colorStr = el.dataset.value
      if (colorStr) {
        try {
          await navigator.clipboard.writeText(colorStr)
          showMessage('Color copied', 'success')
        } catch (error) {
          console.error('Failed to copy color to clipboard:', error)
        }
      }
    }
  }

  return (
    <div className="current-color-display flex col align-start" onClick={handleClick}>
      <div className="header-container">
        <div className="header flex justify-start gap-04">
          <div className="color-dot" style={{ '--color': color?.string || '#000' } as React.CSSProperties}></div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -3 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 3 }}
              key={colorName + '-name'}
            >
              {colorName}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: 3 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -3 }}
              transition={{ delay: 0.1 }}
              key={colorName + '-palette'}
            >
              {fetchedData?.paletteTitle && `in ${fetchedData?.paletteTitle}`}
            </motion.p>
          </div>
        </div>

        <PaletteDisplay paletteType={paletteType} />
      </div>
      <div className={`color-details ${colorSpace.format}`}>
        <div className="color-detail">
          <div className="color-text oklch">
            <p className="color-label">OKLCH</p>
            <p data-value={oklch?.value}>{formatColorValues(oklch?.coords, ['percent', 'none', 'none'])}</p>
          </div>
        </div>
        <div className="color-detail">
          <div className="color-text lch">
            <p className="color-label">LCH</p>
            <p data-value={lch?.value}>{lch.coords.join(' ')}</p>
          </div>
        </div>
        <div className="color-detail">
          <div className="color-text oklab">
            <p className="color-label">OKLAB</p>
            <p data-value={oklab?.value}>{formatColorValues(oklab?.coords, ['percent', 'none', 'none'])}</p>
          </div>
        </div>
        <div className="color-detail">
          <div className="color-text lab">
            <p className="color-label">LAB</p>
            <p data-value={lab?.value}>{lab.coords.join(' ')}</p>
          </div>
        </div>
        <div className="color-detail">
          <ScissorsIcon weight="fill" color={p3?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <div className="color-text p3">
            <p className="color-label">P3</p>
            <p data-value={p3?.value}>{p3.coords.join(' ')}</p>
          </div>
        </div>

        <div className="color-detail ">
          <ScissorsIcon weight="fill" color={hsl?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <div className="color-text hsl">
            <p className="color-label">HSL</p>
            <p data-value={hsl?.value}>{formatColorValues(hsl?.coords, ['none', 'percent', 'percent'], false)}</p>
          </div>
        </div>
        <div className="color-detail">
          <ScissorsIcon weight="fill" color={rgb?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <div className="color-text rgb">
            <p className="color-label">RGB</p>
            <p data-value={rgb?.value}>{formatColorValues(rgb?.coords, ['percent', 'percent', 'percent'])}</p>
          </div>
        </div>
        <div className="color-detail">
          <ScissorsIcon weight="fill" color={hex?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <div className="color-text hex">
            <p className="color-label">HEX</p>
            <p data-value={hex.value}>{hex.value}</p>
          </div>
        </div>
        <div className="color-detail">
          {context.isUiMode ? (
            <AppWindowIcon
              weight="fill"
              size={14}
              color={context.palette[0].color.clone().to('lch').set({ l: 80 }).display()}
            />
          ) : (
            <PaletteIcon
              weight="fill"
              size={14}
              color={context.palette[0].color.clone().to('lch').set({ l: 80 }).display()}
            />
          )}
          <div className="color-text">
            <p>{context.isUiMode ? 'UI Mode' : 'Palette Mode'}</p>
          </div>
        </div>
        <div className="color-detail">
          <SwatchesIcon
            weight="fill"
            size={14}
            color={context.palette[1].color.clone().to('lch').set({ l: 80 }).display()}
          />
          <div className="color-text">
            <p>{paletteTypeFull}</p>
          </div>
        </div>
        <div className="color-detail">
          <CirclesFourIcon
            weight="fill"
            color={context.palette[2].color.clone().to('lch').set({ l: 80 }).display()}
            size={14}
          />
          <div className="color-text">
            <p>{paletteStyle} Variant</p>
          </div>
        </div>
        <div className="color-detail">
          <FadersHorizontalIcon
            weight="fill"
            color={
              effectsEnabled ? context.palette[3].color.clone().to('lch').set({ l: 80 }).display() : 'var(--dimmed)'
            }
            size={14}
          />
          <div className="color-text">
            <p style={{ color: effectsEnabled ? '' : 'var(--dimmed)' }}>Effects Enabled</p>
          </div>
        </div>
      </div>
    </div>
  )
}
