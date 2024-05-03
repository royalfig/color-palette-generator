import { UseCopy } from '../../hooks/useCopy'
import { ColorSpace, PaletteKinds, Palettes, VariationKinds } from '../../types'
import './gradient.css'

export function Gradient({
  palettes,
  palette,
  colorSpace,
  variation,
}: {
  palettes: Palettes
  palette: PaletteKinds
  colorSpace: ColorSpace
  variation: VariationKinds
}) {
  const gradient = palettes[palette][variation].map(color => color[colorSpace].css).join(', ')

  const { copyToClipboard } = UseCopy()

  let inColorSpace

  // Change up hue interploation short/long?
  switch (colorSpace) {
    case 'hex':
    case 'rgb':
    case 'p3':
    case 'oklab':
      inColorSpace = ''
      break
    default:
      inColorSpace = ` in ${colorSpace}`
  }

  const cssGradient = `linear-gradient(90deg${inColorSpace}, transparent, ${gradient}, transparent)`

  return (
    <div>
      <div className="gradient" style={{ background: cssGradient }}></div>
      <button onClick={() => copyToClipboard(cssGradient)}>
        <p className="x-small">{cssGradient}</p>
      </button>
    </div>
  )
}
