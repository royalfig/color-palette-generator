import { useContext } from 'react'
import { ColorContext } from '../ColorContext'
import './color-display.css'
import { ScissorsIcon } from '@phosphor-icons/react/dist/csr/Scissors'
import { ColorSpace, ColorFormat } from '../../types'

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

export function ColorDisplay({
  fetchedData,
  isLoading,
  error,
  colorSpace,
}: {
  fetchedData: { colorNames: string[]; paletteTitle: string; baseColorName: string } | null
  isLoading: boolean
  error: Error | null
  colorSpace: { space: ColorSpace; format: ColorFormat }
}) {
  const colorName = fetchedData?.baseColorName

  const context = useContext(ColorContext)
  const color = context?.palette.find(c => c.isBase)

  const { lch, oklch, lab, oklab, p3, hsl, rgb, hex } = color?.conversions || {}

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest('[data-value]')
    if (el && el instanceof HTMLElement) {
      const colorStr = el.dataset.value
      if (colorStr) {
        try {
          await navigator.clipboard.writeText(colorStr)
        } catch (error) {
          console.error('Failed to copy color to clipboard:', error)
        }
      }
    }
  }

  return (
    <div className="current-color-display flex col align-start" onClick={handleClick}>
      <div className="header flex justify-start gap-04">
        <div className="color-dot" style={{ '--color': color?.string || '#000' } as React.CSSProperties}></div>
        <h1>{colorName}</h1>
      </div>

      <div className={`color-details ${colorSpace.format}`}>
        <div className="color-detail ">
          <div className="color-text">
            <p className="color-label oklch">OKLCH</p>
            <p data-value={oklch?.value}>{formatColorValues(oklch?.coords, ['percent', 'none', 'none'])}</p>
          </div>
        </div>
        <div className="color-detail">
          <div className="color-text">
            <p className="color-label lch">LCH</p>
            <p data-value={lch?.value}>{lch.coords.join(' ')}</p>
          </div>
        </div>
        <div className="color-detail">
          <div className="color-text">
            <p className="color-label oklab">OKLAB</p>
            <p data-value={oklab?.value}>{formatColorValues(oklab?.coords, ['percent', 'none', 'none'])}</p>
          </div>
        </div>
        <div className="color-detail">
          <div className="color-text">
            <p className="color-label lab">LAB</p>
            <p data-value={lab?.value}>{lab.coords.join(' ')}</p>
          </div>
        </div>
        <div className="color-detail">
          <ScissorsIcon weight="fill" color={p3?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <div className="color-text">
            <p className="color-label p3">P3</p>
            <p data-value={p3?.value}>{p3.coords.join(' ')}</p>
          </div>
        </div>

        <div className="color-detail">
          <ScissorsIcon weight="fill" color={hsl?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <div className="color-text">
            <p className="color-label hsl">HSL</p>
            <p data-value={hsl?.value}>{formatColorValues(hsl?.coords, ['none', 'percent', 'percent'], false)}</p>
          </div>
        </div>
        <div className="color-detail ">
          <ScissorsIcon weight="fill" color={rgb?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <div className="color-text">
            <p className="color-label rgb">RGB</p>
            <p data-value={rgb?.value}>{formatColorValues(rgb?.coords, ['percent', 'percent', 'percent'])}</p>
          </div>
        </div>
        <div className="color-detail">
          <ScissorsIcon weight="fill" color={hex?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <div className="color-text">
            <p className="color-label hex">HEX</p>
            <p data-value={hex.value}>{hex.value}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
