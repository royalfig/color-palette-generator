import { useContext } from 'react'
import { ColorContext } from '../ColorContext'
import './color-display.css'
import { ScissorsIcon } from '@phosphor-icons/react/dist/csr/Scissors'
import { ColorSpace, ColorFormat } from '../../types'

export function ColorDisplay({
  fetchedData,
  isLoading,
  error,
  colorSpace,
}: {
  fetchedData: { colorNames: string[]; paletteTitle: string } | null
  isLoading: boolean
  error: Error | null
  colorSpace: { space: ColorSpace; format: ColorFormat }
}) {
  const colorName = fetchedData?.colorNames[0]

  const context = useContext(ColorContext)
  const color = context?.palette[0]

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
      <div className="flex justify-start gap-04">
        <div
          className="color-dot"
          style={{ '--color': context?.palette[0].string || '#000' } as React.CSSProperties}
        ></div>
        <h1>{colorName}</h1>
      </div>

      <div className={`color-details ${colorSpace.format}`}>
        <div className="color-detail oklch">
          <ScissorsIcon weight="fill" color={oklch?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <p data-value={oklch.value}>{oklch?.value}</p>
        </div>
        <div className="color-detail lch">
          <ScissorsIcon weight="fill" color={lch?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <p data-value={lch.value}>{lch?.value}</p>
        </div>
        <div className="color-detail oklab">
          <ScissorsIcon weight="fill" color={oklab?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <p data-value={oklab.value}>{oklab?.value}</p>
        </div>
        <div className="color-detail lab">
          <ScissorsIcon weight="fill" color={lab?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <p data-value={lab.value}>{lab?.value}</p>
        </div>
        <div className="color-detail p3">
          <ScissorsIcon weight="fill" color={p3?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <p data-value={p3.value}>{p3?.value}</p>
        </div>

        <div className="color-detail hsl">
          <ScissorsIcon weight="fill" color={hsl?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <p data-value={hsl.value}>{hsl?.value}</p>
        </div>
        <div className="color-detail rgb">
          <ScissorsIcon weight="fill" color={rgb?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <p data-value={rgb.value}>{rgb?.value}</p>
        </div>
        <div className="color-detail hex">
          <ScissorsIcon weight="fill" color={hex?.isInGamut ? 'var(--dimmed)' : 'var(--warning)'} size={14} />
          <p data-value={hex.value}>{hex?.value}</p>
        </div>
      </div>
    </div>
  )
}
