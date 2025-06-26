import { RewindIcon } from '@phosphor-icons/react/dist/csr/Rewind'
import { InfoIcon } from '@phosphor-icons/react/dist/csr/Info'
import { AppWindowIcon } from '@phosphor-icons/react/dist/csr/AppWindow'
import { MoonStarsIcon } from '@phosphor-icons/react/dist/csr/MoonStars'
import { SunIcon } from '@phosphor-icons/react/dist/csr/Sun'
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
        <InfoIcon size={20} color="url(#info-gradient)" weight="fill">
          <LinearGradientSVG id="info-gradient" />
        </InfoIcon>
      </Button>
      <Button
        handler={() => {
          setShowPaletteColors(false)
          setShowColorHistory(!showColorHistory)
        }}
        active={showColorHistory}
      >
        <RewindIcon size={20} color="url(#rewind-gradient)" weight="fill">
          <LinearGradientSVG id="rewind-gradient" />
        </RewindIcon>
      </Button>
      <Button handler={() => {}} active={false}>
        <AppWindowIcon size={20} color="url(#app-window-gradient)" weight="fill">
          <LinearGradientSVG id="app-window-gradient" />
        </AppWindowIcon>
      </Button>
      <Button handler={toggleDarkMode} active={isDarkMode}>
        {isDarkMode ? (
          <SunIcon size={20} color="url(#sun-gradient)" weight="fill">
            <LinearGradientSVG id="sun-gradient" />
          </SunIcon>
        ) : (
          <MoonStarsIcon size={20} color="url(#moon-gradient)" weight="fill">
            <LinearGradientSVG id="moon-gradient" />
          </MoonStarsIcon>
        )}
      </Button>
    </div>
  )
}
