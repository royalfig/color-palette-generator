import { RewindIcon, InfoIcon, LayoutIcon, MoonStarsIcon, SunIcon } from '@phosphor-icons/react'
import Button from '../button/Button'
import './palette-tool-selector.css'
import { LinearGradientSVG } from '../LinearGradientSVG'
export function PaletteToolSelector({
  showPaletteColors,
  setShowPaletteColors,
  isDarkMode,
  toggleDarkMode,
  showColorHistory,
  setShowColorHistory,
}: {
  showPaletteColors: boolean
  setShowPaletteColors: React.Dispatch<React.SetStateAction<boolean>>
  isDarkMode: boolean
  toggleDarkMode: () => void
  showColorHistory: boolean
  setShowColorHistory: React.Dispatch<React.SetStateAction<boolean>>
}) {
  return (
    <div className="palette-tool-container">
      <Button
        handler={() => {
          setShowPaletteColors(!showPaletteColors)
          setShowColorHistory(false)
        }}
        active={showPaletteColors}
      >
        <InfoIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </InfoIcon>
      </Button>
      <Button
        handler={() => {
          setShowPaletteColors(false)
          setShowColorHistory(!showColorHistory)
        }}
        active={showColorHistory}
      >
        <RewindIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </RewindIcon>
      </Button>
      <Button handler={() => {}} active={false}>
        <LayoutIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </LayoutIcon>
      </Button>
      <Button handler={toggleDarkMode} active={isDarkMode}>
        {isDarkMode ? (
          <SunIcon size={20} color="url(#gradient)">
            <LinearGradientSVG />
          </SunIcon>
        ) : (
          <MoonStarsIcon size={20} color="url(#gradient)">
            <LinearGradientSVG />
          </MoonStarsIcon>
        )}
      </Button>
    </div>
  )
}
