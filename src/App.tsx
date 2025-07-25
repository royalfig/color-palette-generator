import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ColorContext } from './components/ColorContext'
import { MessageContext, MessageType } from './components/MessageContext'
import { AuxillaryDisplay } from './components/auxillary-display/AuxillaryDisplay'
import { ColorDisplay } from './components/color-display/ColorDisplay'
import { ColorSpaceSelector } from './components/color-space-selector/ColorSpaceSelector'
import { DisplayInfo } from './components/display-info/DisplayInfo'
import { Display } from './components/display/Display'
import { SliderGroup } from './components/hue-slider/SliderGroup'
import { InputColorContainer } from './components/input-color-container/InputColorContainer'
import { Knob } from './components/knob/Knob'
import { PaletteStyleSelector } from './components/palette-style-selector/PaletteStyleSelector'
import { PaletteToolSelector } from './components/palette-tool-selector/PaletteToolSelector'
import { SectionHeader } from './components/section-header/SectionHeader'
import './css/App.css'
import './css/Defaults.css'
import './css/Reset.css'
import './css/Variables.css'
import './css/utils.css'
import { ExportOptions } from './export-options/ExportOptions'
import { useFetchColorNames } from './hooks/useColorName'
import { useDarkMode } from './hooks/useDarkMode'
import { Options } from './options/Options'
import { PaletteTypeSelector } from './palette-type-selector/PaletteTypeSelector'
import type { ColorFormat, ColorSpaceAndFormat, PaletteKinds } from './types'
import { createPalettes } from './util'
import { colorFactory } from './util/factory'
import { pickRandomColor } from './util/pickRandomColor'

const Manual = lazy(() => import('./components/manual/Manual.js'))

function parsedInitialColorSpace(initialColorFormat: ColorFormat): ColorSpaceAndFormat {
  switch (initialColorFormat) {
    case 'oklch':
      return { space: 'oklch', format: 'oklch' }
    case 'oklab':
      return { space: 'oklab', format: 'oklab' }
    case 'rgb':
      return { space: 'srgb', format: 'rgb' }
    case 'hsl':
      return { space: 'hsl', format: 'hsl' }
    case 'p3':
      return { space: 'p3', format: 'p3' }
    case 'hex':
      return { space: 'srgb', format: 'hex' }
    case 'lab':
      return { space: 'lab', format: 'lab' }
    case 'lch':
      return { space: 'lch', format: 'lch' }
    default:
      return { space: 'oklch', format: 'oklch' }
  }
}

export type ColorName = {
  fetchedData: {
    colorNames: string[]
    paletteTitle: string
  } | null
  isLoading: boolean
  error: Error | null
}

function updateFavicon(color: string) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Draw a filled circle with the current color
  ctx.clearRect(0, 0, size, size)
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()

  // Convert canvas to data URL
  const url = canvas.toDataURL('image/png')

  // Find or create the favicon link element
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
}

export default function App() {
  // Parse URL parameters for initial state
  const params = new URLSearchParams(document.location.search)

  const initialColor = params.get('color') || pickRandomColor()
  const initialPaletteType = (params.get('paletteType') as PaletteKinds) || 'spl'
  const initialPaletteStyle = (params.get('paletteStyle') as 'square' | 'triangle' | 'circle' | 'diamond') || 'square'
  const initialColorFormat = (params.get('colorFormat') as ColorFormat) || 'oklch'
  const initialKnobValues = params.get('effects')
    ? params
        .get('effects')!
        .split(',')
        .map(v => parseFloat(v) || 0)
    : [0, 0, 0, 0]
  // If you want to support colorSpace as a param, otherwise default to 'oklch'

  // State initialization using URL params or defaults
  const [color, setColor] = useState<string>(initialColor)
  const [showPaletteColors, setShowPaletteColors] = useState(false)
  const [paletteType, setPaletteType] = useState<PaletteKinds>(initialPaletteType)
  const [showColorHistory, setShowColorHistory] = useState(false)
  const [colorHistory, setColorHistory] = useState<string[]>([])
  const [paletteStyle, setPaletteStyle] = useState<'square' | 'triangle' | 'circle' | 'diamond'>(initialPaletteStyle)
  const [colorSpace, setColorSpace] = useState<ColorSpaceAndFormat>(parsedInitialColorSpace(initialColorFormat))
  const [knobValues, setKnobValues] = useState(initialKnobValues)
  const [isUiMode, setUiMode] = useState(false)

  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<MessageType | null>(null)

  const showMessage = useCallback((msg: string, msgType: MessageType) => {
    setMessage(msg)
    setMessageType(msgType)

    setTimeout(() => {
      setMessage(null)
      setMessageType(null)
    }, 3000)
  }, [])

  const messageContextValue = useMemo(
    () => ({
      message,
      messageType,
      showMessage,
    }),
    [message, messageType, showMessage],
  )

  const palette = useMemo(
    () => createPalettes(color, paletteType, paletteStyle, colorSpace, knobValues, isUiMode, isDarkMode),
    [color, paletteType, paletteStyle, colorSpace, knobValues, isUiMode, isDarkMode],
  )

  const colorContext = useMemo(
    () => ({ originalColor: colorFactory(color, 'base', 0, colorSpace.format), palette, isUiMode }),
    [color, palette, colorSpace.format, isUiMode],
  )

  // const css = generateCss(palettes)
  // const base = useBaseColor(palettes)

  const { fetchedData, isLoading, error: colorNameError } = useFetchColorNames(palette, colorContext.originalColor)

  // useEffect(() => {
  //   const styleEl = document.createElement('style')
  //   styleEl.textContent = `:root { ${css} }`
  //   styleEl.setAttribute('id', 'color-palette')
  //   document.head.append(styleEl)

  //   return () => {
  //     document.head.removeChild(styleEl)
  //   }
  // }, [css])

  // Load color history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('color-history')
    if (stored) {
      setColorHistory(JSON.parse(stored))
    }
  }, [])

  // Update color history in state and localStorage when base color changes
  useEffect(() => {
    setColorHistory(prev => {
      let updated = prev.filter(c => c !== colorContext.originalColor.string)
      updated.push(colorContext.originalColor.string)
      // Limit to 240 colors, drop oldest if exceeded
      if (updated.length > 240) {
        updated = updated.slice(updated.length - 240)
      }
      localStorage.setItem('color-history', JSON.stringify(updated))
      return updated
    })
  }, [colorContext.originalColor.string])

  // Update URL params whenever any relevant parameter changes
  useEffect(() => {
    const colorUrl = new URLSearchParams(document.location.search)
    const currentColor = colorUrl.get('color')
    const currentPaletteType = colorUrl.get('paletteType')
    const currentPaletteStyle = colorUrl.get('paletteStyle')
    const currentColorFormat = colorUrl.get('colorFormat')
    const currentEffects = colorUrl.get('effects')

    const effectsString = knobValues.join(',')
    const needsUpdate =
      currentColor !== colorContext.originalColor.string ||
      currentPaletteType !== paletteType ||
      currentPaletteStyle !== paletteStyle ||
      currentColorFormat !== colorSpace.format ||
      currentEffects !== effectsString

    if (needsUpdate) {
      colorUrl.set('color', colorContext.originalColor.string)
      colorUrl.set('paletteType', paletteType)
      colorUrl.set('paletteStyle', paletteStyle)
      colorUrl.set('colorFormat', colorSpace.format)
      colorUrl.set('effects', effectsString)
      window.history.pushState({}, '', `${window.location.pathname}?${colorUrl.toString()}`)
    }
  }, [colorContext.originalColor.string, paletteType, paletteStyle, colorSpace.format, knobValues])

  useEffect(() => {
    updateFavicon(colorContext.originalColor.cssValue)
    document.documentElement.style.setProperty('--base-color', colorContext.originalColor.cssValue)
  }, [colorContext.originalColor])

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const colorParam = params.get('color')
      const paletteTypeParam = params.get('paletteType')
      const paletteStyleParam = params.get('paletteStyle')
      const colorFormatParam = params.get('colorFormat')
      const effectsParam = params.get('effects')

      if (colorParam) {
        setColor(colorParam)
      }
      if (paletteTypeParam) {
        setPaletteType(paletteTypeParam as PaletteKinds)
      }
      if (paletteStyleParam) {
        setPaletteStyle(paletteStyleParam as 'square' | 'triangle' | 'circle' | 'diamond')
      }
      if (colorFormatParam) {
        setColorSpace(parsedInitialColorSpace(colorFormatParam as ColorFormat))
      }
      if (effectsParam) {
        setKnobValues(effectsParam.split(',').map(v => parseFloat(v) || 0))
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Knob values state (4 knobs, default 0)

  if (window.location.pathname === '/manual') {
    if (window.location.search) {
      window.history.replaceState({}, '', '/manual')
    }
    return (
      <ColorContext.Provider value={colorContext}>
        <Suspense fallback={<div>Loading...</div>}>
          <Manual />
        </Suspense>
      </ColorContext.Provider>
    )
  }
  return (
    <ColorContext.Provider value={colorContext}>
      <MessageContext.Provider value={messageContextValue}>
        <div className="bg">
          <div className="bg-inner">
            <main className="synth-container">
              <SectionHeader />
              <Display>
                <ColorDisplay
                  fetchedData={fetchedData}
                  isLoading={isLoading}
                  error={colorNameError}
                  colorSpace={colorSpace}
                  paletteType={paletteType}
                  paletteStyle={paletteStyle}
                  knobValues={knobValues}
                />

                <AuxillaryDisplay
                  showPaletteColors={showPaletteColors}
                  colorSpace={colorSpace}
                  colorNames={fetchedData?.colorNames || []}
                  paletteType={paletteType}
                  paletteStyle={paletteStyle}
                  showColorHistory={showColorHistory}
                  setColor={setColor}
                  colorHistory={colorHistory}
                  setColorHistory={setColorHistory}
                />
              </Display>
              <div className="synth-body col-12">
                <ColorSpaceSelector colorSpace={colorSpace} setColorSpace={setColorSpace} />
                <InputColorContainer setColor={setColor} setColorSpace={setColorSpace} colorSpace={colorSpace} />

                <PaletteTypeSelector paletteType={paletteType} setPaletteType={setPaletteType} />
                <PaletteStyleSelector paletteStyle={paletteStyle} setPaletteStyle={setPaletteStyle} />
                <PaletteToolSelector
                  showPaletteColors={showPaletteColors}
                  setShowPaletteColors={setShowPaletteColors}
                  isDarkMode={isDarkMode}
                  toggleDarkMode={toggleDarkMode}
                  showColorHistory={showColorHistory}
                  setShowColorHistory={setShowColorHistory}
                  isUiMode={isUiMode}
                  setIsUiMode={setUiMode}
                />
                <ExportOptions
                  fetchedData={fetchedData}
                  isLoading={isLoading}
                  error={colorNameError}
                  colorFormat={colorSpace.format}
                />
                <Knob initialValues={knobValues} onChange={setKnobValues} />

                <DisplayInfo />
                {/* <HueSlider setColor={setColor} colorSpace={colorSpace} /> */}

                <Options setColor={setColor} />

                <SliderGroup colorSpace={colorSpace} setColor={setColor} />
              </div>
            </main>
          </div>
        </div>
      </MessageContext.Provider>
    </ColorContext.Provider>
  )
}
