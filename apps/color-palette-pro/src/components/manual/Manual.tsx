import { ColorSpaceSelector, ColorSpaceSelectorHeader } from './ColorSpaceSelector'
import { Introduction, IntroductionHeader } from './Introduction'
import './manual.css'
import { Page } from './Page'
import { TheDisplay, TheDisplayHeader } from './TheDisplay'
import { PaletteStyleSelector, PaletteStyleSelectorHeader } from './PaletteStyleSelector'
import { PaletteTypeSelector, PaletteTypeSelectorHeader } from './PaletteTypeSelector'
import { ColorInputModule, ColorInputModuleHeader } from './ColorInputModule'
import { SliderModule, SliderModuleHeader } from './SliderModule'
import { DisplayInfoPanel, DisplayInfoPanelHeader } from './DisplayInfoPanel'
import { Knobs, KnobsHeader } from './Knobs'
import { PaletteTools, PaletteToolsHeader } from './PaletteTools'
import { ExportOptions, ExportOptionsHeader } from './ExportOptions'
import { UtilityButtons, UtilityButtonsHeader } from './UtilityButtons'

export default function Manual() {
  return (
    <div className="manual-container">
      <div className="page-container">
        <header>
          <h1 className="brand">
            <span>Color</span>
            Palette Pro
          </h1>
          <div className="manual-divider"></div>
        </header>

        <p>
          The ColorPalette Pro synthesizer generates 6 different color palettes, in 4 styles, across 8 color spaces and
          formats.
        </p>

        <p>Export, share, download, and copy palettes to create beautiful artworks, websites, and designs.</p>

        <p>
          Designed and developed by{' '}
          <a style={{ color: 'var(--primary)' }} href="https://ryanfeigenbaum.com">
            Ryan Feigenbaum
          </a>
          .
        </p>
      </div>

      <Page id="table-of-contents" title="Table of Contents">
        <ol>
          <IntroductionHeader />
          <TheDisplayHeader />
          <ColorSpaceSelectorHeader />
          <PaletteTypeSelectorHeader />
          <PaletteStyleSelectorHeader />
          <ColorInputModuleHeader />
          <SliderModuleHeader />
          <KnobsHeader />
          <PaletteToolsHeader />
          <ExportOptionsHeader />
          <UtilityButtonsHeader />
          <DisplayInfoPanelHeader />
        </ol>
      </Page>

      <Introduction />
      <TheDisplay />
      <ColorSpaceSelector />
      <PaletteTypeSelector />
      <PaletteStyleSelector />
      <ColorInputModule />
      <SliderModule />
      <Knobs />
      <PaletteTools />
      <ExportOptions />
      <UtilityButtons />
      <DisplayInfoPanel />
    </div>
  )
}
