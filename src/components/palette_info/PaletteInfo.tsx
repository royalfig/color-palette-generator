import { useEffect, useState } from 'react'
import { Circle } from '../circle/Circle'
import './palette-info.css'
import { motion, AnimatePresence } from 'framer-motion'
import { ColorName } from '../../App'
import { BaseColorData, ColorSpace, PaletteKinds, Palettes, VariationKinds } from '../../types'
import { LightUpSvg } from '../input-color/LightUpSvg'
import {
  AdjustmentsHorizontalIcon,
  BoltIcon,
  CloudIcon,
  FilmIcon,
  FireIcon,
  LightBulbIcon,
  NoSymbolIcon,
  ScaleIcon,
  SwatchIcon,
  VariableIcon,
  XCircleIcon,
  BellAlertIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/solid'
import { Gradient } from './Gradient'

function getFullName(palette: string) {
  switch (palette) {
    case 'com':
      return 'Complementary'
    case 'ana':
      return 'Analogous'
    case 'ton':
      return 'Tones'
    case 'tas':
      return 'Tints & shades'
    case 'pol':
      return 'Polychromia'
    case 'tri':
      return 'Triadic'
    case 'tet':
      return 'Tetradic'
    case 'spl':
      return 'Split complementary'
    default:
      return palette
  }
}

function createNarrative(palette: string, variation: string, paletteTitle: string) {
  let narrative = ''
  switch (palette) {
    case 'com':
      narrative = `${paletteTitle} is a complementary palette features two colors opposite each other on the color wheel.`
      break
    case 'ana':
      narrative = `${paletteTitle} is an analogous palette features three colors next to each other on the color wheel.`
      break
    case 'ton':
      narrative = `${paletteTitle} is a tones palette features a color with varying degrees of saturation and brightness.`
      break
    case 'tas':
      narrative = `${paletteTitle} is a tints & shades palette features a color with varying degrees of lightness and darkness.`
      break
    case 'pol':
      narrative = `${paletteTitle} is a polychromia palette features a color with varying degrees of saturation.`
      break
    case 'tri':
      narrative = `${paletteTitle} is a triadic palette features three colors evenly spaced around the color wheel.`
      break
    case 'tet':
      narrative = `${paletteTitle} is a tetradic palette features four colors evenly spaced around the color wheel.`
      break
    case 'spl':
      narrative = `${paletteTitle} is a split complementary palette features three colors, one color and two colors adjacent to its complementary color.`
      break
    default:
      narrative = palette
  }

  switch (variation) {
    case 'og':
      narrative += ' The original variation operates in the RGB colorspace with absolute luminance.'
      break
    case 'keel':
      narrative += ' The keel variation operates in the RGB colorspace with relative luminance.'
      break
    case 'film':
      narrative += ' The film variation operates in the RGB colorspace with relative luminance.'
      break
    case 'cloud':
      narrative += ' The languid variation operates in the RGB colorspace with relative luminance.'
      break
    case 'fire':
      narrative += ' The sharkbite variation operates in the RGB colorspace with relative luminance.'
      break
    default:
      narrative += variation
  }

  return narrative
}

function determineSupportedColorspace() {
  if (window.matchMedia('(color-gamut: rec2020)').matches) {
    return {
      colorGamut: 'REC.2020',
      colorGamutDescription: 'This display supports up to 75% of the visible spectrum.',
    }
  }

  if (window.matchMedia('(color-gamut: p3)').matches) {
    return {
      colorGamut: 'P3',
      colorGamutDescription: 'This display supports up to 45% of the visible spectrum.',
    }
  }

  if (window.matchMedia('(color-gamut: srgb)').matches) {
    return {
      colorGamut: 'sRGB',
      colorGamutDescription: 'This display supports sRGB, up to 35% of the visible spectrum.',
    }
  }

  return {
    colorGamut: '?',
    colorGamutDescription: 'Display support cannot be determined.',
  }
}

type DisplaySupport = ReturnType<typeof determineSupportedColorspace>

export function PaletteInfo({
  base,
  palette,
  variation,
  colorspaceType,
  palettes,
  colorName,
  isActive,
  error,
}: {
  base: BaseColorData
  palette: PaletteKinds
  variation: VariationKinds
  colorspaceType: ColorSpace
  palettes: Palettes
  colorName: ColorName
  isActive: boolean
  error: string
}) {
  console.log('🚀 ~ isActive:', isActive)
  const [displaySupport, setDisplaySupport] = useState<DisplaySupport | null>(null)

  const colorSpaces = Object.entries(base).slice(1)
  // create two arrays of similar lengths of the colorspaces
  const colorSpaces1 = colorSpaces.slice(0, colorSpaces.length / 2)
  const colorSpaces2 = colorSpaces.slice(colorSpaces.length / 2)

  const paletteTitle = colorName.fetchedData?.paletteTitle

  useEffect(() => {
    setDisplaySupport(determineSupportedColorspace())
  }, [])

  const colorBlocks = Array(10)
    .fill('var(--border)')
    .map((color: string, idx: number) => {
      return palettes?.[palette]?.[variation]?.[idx]?.[colorspaceType].string
        ? palettes[palette][variation][idx][colorspaceType].string
        : color
    })

  const variants = {
    enter: { opacity: 0 },
    exit: { opacity: 0 },
  }

  return (
    <div className="pallete-info">
      <div className="palette-info-main">
        <div className="flex gap-4 palette-info-name-container">
          <div className="flex gap-2">
            {['ton', 'tas', 'pol'].includes(palette) ? (
              <Circle colors={palettes[palette]} type="circle" size="small" />
            ) : (
              <Circle colors={palettes[palette]} type="default" size="small" />
            )}
            <p className="palette-info-name">{colorName.isLoading ? '' : colorName.fetchedData?.paletteTitle} </p>
          </div>

          <div className="activity-monitor">{isActive ? <LightUpSvg /> : <BoltIcon />}</div>
        </div>

        <div className="color-blocks-container">
          <DataHeading>
            <SwatchIcon />
            <p>{getFullName(palette)} Palette</p>
          </DataHeading>
          <div className="color-blocks">
            {colorBlocks.map((color: any, idx: number) => (
              <div className="color-block" style={{ backgroundColor: color }} key={idx} />
            ))}
          </div>
        </div>

        <TwoColumn>
          <div>
            <DataHeading>
              <VariableIcon />
              <p>{variation} Variation</p>
            </DataHeading>
            <div className="variation-icons flex gap-2 justify-start">
              <AdjustmentsHorizontalIcon className={variation === 'og' ? 'active' : ''} />
              <ScaleIcon className={variation === 'keel' ? 'active' : ''} />
              <FilmIcon className={variation === 'film' ? 'active' : ''} />
              <CloudIcon className={variation === 'cloud' ? 'active' : ''} />
              <FireIcon className={variation === 'fire' ? 'active' : ''} />
            </div>
          </div>

          <div>
            <DataHeading>
              <ComputerDesktopIcon />
              <p>Display Support</p>
            </DataHeading>
            <p className='x-small'>
              <span>{displaySupport?.colorGamut}</span>: {displaySupport?.colorGamutDescription}
            </p>
          </div>
        </TwoColumn>

        <TwoColumn>
          <div>
            <DataHeading>
              <BellAlertIcon />
              <p>Info</p>
            </DataHeading>
          </div>
          <div>
            <DataHeading>
              <XCircleIcon />
              <p>Error</p>
            </DataHeading>
            <p className="x-small">{error}</p>
          </div>
        </TwoColumn>
      </div>

      <div className="palette-info-3">
        <p className="palette-info-description">{createNarrative(palette, variation, paletteTitle)}</p>

        <div className="palette-info-colorspace">
          {colorSpaces.map(([key, value]) => (
            <div key={key}>
              <p>
                <span>{key}</span>
                {removeNonNumericalElements(value.string)}
              </p>
            </div>
          ))}
        </div>

        <Gradient palettes={palettes} colorSpace={colorspaceType} palette={palette} variation={variation} />
      </div>
      <div className="palette-info-gamut flex col align-start gap-2">
        <DataHeading>
          {base.hex.isInGamut ? (
            <>
              <LightBulbIcon />
              <p>in srgb gamut</p>
            </>
          ) : (
            <>
              <NoSymbolIcon />
              <p>not in srgb gamut</p>
            </>
          )}
        </DataHeading>
        <p className="x-small">{base.hex.isInGamut ? 'Supported in all browsers' : 'Browser support may be limited'}</p>
      </div>
    </div>
  )
}

function removeNonNumericalElements(str: string) {
  return str.replace(/(hex|hsl|rgb|lch|lab|color|display-p3|oklch|oklab)|[()]/g, '')
}

function DataHeading({ children }: { children: React.ReactNode }) {
  return <div className="data-heading flex gap-2">{children}</div>
}

function TwoColumn({ children }: { children: React.ReactNode }) {
  return <div className="two-column">{children}</div>
}
