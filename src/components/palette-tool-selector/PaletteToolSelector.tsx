import { RewindIcon, InfoIcon, LayoutIcon, MoonStarsIcon } from '@phosphor-icons/react'
import Button from '../button/Button'
import { container } from './palette-tool-selector.module.css'
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
    <div className={container}>
      <Button handler={handleShowPaletteColors} active={showPaletteColors}>
        <InfoIcon weight="fill" size={20} />
      </Button>
      <Button handler={() => {}} active={false}>
        <RewindIcon weight="fill" size={20} />
      </Button>
      <Button handler={() => {}} active={false}>
        <LayoutIcon weight="fill" size={20} />
      </Button>
      <Button handler={() => {}} active={false}>
        <MoonStarsIcon weight="fill" size={20} />
      </Button>
    </div>
  )
}
