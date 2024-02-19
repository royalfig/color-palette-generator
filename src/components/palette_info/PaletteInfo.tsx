import { useEffect, useState } from 'react'
import { Schemes } from '../../util/palettes'
import { Circle } from '../circle/Circle'
import './palette-info.css'
import { motion, AnimatePresence } from 'framer-motion'
import { ColorName } from '../../App'

function getFullName(palette: string) {
  switch (palette) {
    case 'comp':
      return 'Complementary'
    case 'ana':
      return 'Analogous'
    case 'tones':
      return 'Tones'
    case 'tints':
      return 'Tints & shades'
    case 'poly':
      return 'Polychromia'
    case 'tria':
      return 'Triadic'
    case 'tetra':
      return 'Tetradic'
    case 'split':
      return 'Split complementary'
    default:
      return palette
  }
}

function createNarrative(palette: string, variation: string, paletteTitle: string) {
  let narrative = ''
  switch (palette) {
    case 'comp':
      narrative = `${paletteTitle} is a complementary palette features two colors opposite each other on the color wheel.`
      break
    case 'ana':
      narrative = `${paletteTitle} is an analogous palette features three colors next to each other on the color wheel.`
      break
    case 'tones':
      narrative = `${paletteTitle} is a tones palette features a color with varying degrees of saturation and brightness.`
      break
    case 'tints':
      narrative = `${paletteTitle} is a tints & shades palette features a color with varying degrees of lightness and darkness.`
      break
    case 'poly':
      narrative = `${paletteTitle} is a polychromia palette features a color with varying degrees of saturation.`
      break
    case 'tria':
      narrative = `${paletteTitle} is a triadic palette features three colors evenly spaced around the color wheel.`
      break
    case 'tetra':
      narrative = `${paletteTitle} is a tetradic palette features four colors evenly spaced around the color wheel.`
      break
    case 'split':
      narrative = `${paletteTitle} is a split complementary palette features three colors, one color and two colors adjacent to its complementary color.`
      break
    default:
      narrative = palette
  }

  switch (variation) {
    case 'original':
      narrative += ' The original variation operates in the RGB colorspace with absolute luminance.'
      break
    case 'keel':
      narrative += ' The keel variation operates in the RGB colorspace with relative luminance.'
      break
    case 'cinematic':
      narrative += ' The cinematic variation operates in the RGB colorspace with relative luminance.'
      break
    case 'languid':
      narrative += ' The languid variation operates in the RGB colorspace with relative luminance.'
      break
    case 'sharkbite':
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
      colorGamutDescription: 'This display supports up to 75% percent of the human visible spectrum.',
    }
  }

  if (window.matchMedia('(color-gamut: p3)').matches) {
    return {
      colorGamut: 'P3',
      colorGamutDescription: 'This display supports up to 45% percent of the human visible spectrum.',
    }
  }

  if (window.matchMedia('(color-gamut: srgb)').matches) {
    return {
      colorGamut: 'SRGB',
      colorGamutDescription: 'This display supports sRGB, up to 35% percent of the human visible spectrum.',
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
}: {
  base: any
  palette: string
  variation: string
  colorspaceType: string
  palettes: Schemes
  colorName: ColorName
}) {
  const [displaySupport, setDisplaySupport] = useState<DisplaySupport | null>(null)


  const colorSpaces = Object.entries(base).slice(1)
  // create two arrays of similar lengths of the colorspaces
  const colorSpaces1 = colorSpaces.slice(0, colorSpaces.length / 2)
  const colorSpaces2 = colorSpaces.slice(colorSpaces.length / 2)

  const paletteTitle = colorName.fetchedData?.paletteTitle

  useEffect(() => {
    setDisplaySupport(determineSupportedColorspace())
  }, [])

  const colorBlocks = Array(10).fill("var(--border)").map((color: any, idx: number) => {
    return palettes?.[palette]?.[variation]?.[idx]?.[colorspaceType].string ? palettes[palette][variation][idx][colorspaceType].string : color
  })
  

  const variants = {
    enter: { opacity: 0 },
    exit: { opacity: 0 },
  }

  // const colorSpaces2 = colorSpaces.slice(5)
  return (
    <div className="pallete-info">
     

      <div className="palette-info-main">
        <p className="palette-info-palette-type">
          
          {getFullName(palette)} <span className="palette-info-meta">Palette</span>
        </p>
        <p className="palette-info-color-name">
          {colorName.isLoading ? '' : colorName.fetchedData?.paletteTitle}{' '}
          <span className="palette-info-meta">Palette</span>
        </p>
        
        <p className="palette-info-variation">
          {variation} <span className="palette-info-meta">Variation</span>
        </p>
        <p className="palette-info-code">
          --{base.code}: {base.oklch.raw.join(' ')}
        </p>
        <p className="palette-info-gamut">{base.hex.isInGamut ? 'In sRGB Gamut' : 'Out of sRGB Gamut'}</p>
        {['tones', 'tints', 'poly'].includes(palette) ? (
              <Circle colors={palettes[palette]} type="circle" size="large" />
            ) : (
              <Circle colors={palettes[palette]} type="default" size="large" />
            )}

            <div className="color-blocks">
              {colorBlocks.map((color: any, idx: number) => (
                <div className='color-block' style={{ backgroundColor: color }} key={idx} />
              ))}
            </div>
      </div>

<div className="palette-info-3">
      <p className="palette-info-description">
        {createNarrative(palette, variation, paletteTitle)}
      </p>

      <div className="palette-info-colorspace">
        {colorSpaces.map(([key, value]) => (
          <div key={key}>
            <p><span>{key}</span>{removeNonNumericalElements(value.string)}</p>
          </div>
        ))}
      </div>

</div>

      <div className="palette-info-display-support flex gap-4">
        <p>
          <span>{displaySupport?.colorGamut}</span>: {displaySupport?.colorGamutDescription}
        </p>
        
      </div>
    </div>
  )
}

function removeNonNumericalElements(str: string) {
  return str.replace(/[^0-9% .#-]/g, '')
}