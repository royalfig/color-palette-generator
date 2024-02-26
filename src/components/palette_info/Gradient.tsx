import { ColorSpace, PaletteKinds, Palettes, VariationKinds } from '../../types'

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
    <div className='mb-6'>
      <div
        className="gradient"
        style={{ background: cssGradient, height: '.5rem', marginBlockEnd: 'var(--spacing-03)' }}
      ></div>
      <p className='x-small'>{cssGradient}</p>
    </div>
  )
}
