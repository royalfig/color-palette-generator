import { InfoIcon } from '@phosphor-icons/react'
import Button from '../button/Button'

export function PaletteToolSelector({
  showPaletteColors,
  setShowPaletteColors,
}: {
  showPaletteColors: boolean
  setShowPaletteColors: (show: boolean) => void
}) {
  function handleShowPaletteColors() {
    setShowPaletteColors(!showPaletteColors)
  }

  return (
    <div>
      <Button handler={handleShowPaletteColors} active={showPaletteColors}>
        <InfoIcon weight="fill" size={20} />
      </Button>
    </div>
  )
}
