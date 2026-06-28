import { ClipboardTextIcon } from '@phosphor-icons/react/dist/csr/ClipboardText'
import { FileArrowDownIcon } from '@phosphor-icons/react/dist/csr/FileArrowDown'
import { ImageIcon } from '@phosphor-icons/react/dist/csr/Image'
import { LinkIcon } from '@phosphor-icons/react/dist/csr/Link'
import { useContext } from 'react'
import Color from 'colorjs.io'
import { ColorName } from '../hooks/useColorName'
import Button from '../components/button/Button'
import { ColorContext } from '../components/ColorContext'
import { LinearGradientSVG } from '../components/LinearGradientSVG'
import { MessageContext } from '../components/MessageContext'
import { ColorFormat, BaseColorData, generateCssVariables } from '@royalfig/color-palette-pro'
import type { CodeThemeOutput } from '@royalfig/color-palette-pro'
import './export-options.css'

function downloadAction(
  palette: BaseColorData[],
  paletteTitle: string,
  colorFormat: ColorFormat,
  isUiMode: boolean,
  paletteStyle: 'square' | 'triangle' | 'circle' | 'diamond',
  cb: (msg: string, type: 'success' | 'error') => void,
) {
  const paletteAsCss = generateCssVariables(palette, {
    format: colorFormat,
    isUiMode,
    wrapper: 'root',
    style: paletteStyle,
  })
  const filename = `${paletteTitle?.toLowerCase().replace(/\W/g, '-') || 'color-palette-pro'}.css`
  const type = 'text'

  const blob = new Blob([paletteAsCss], { type })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  cb('Downloaded', 'success')
}

function downloadPaletteAsImage(
  baseColor: BaseColorData,
  palette: BaseColorData[],
  colorNames: ColorName,
  colorFormat: ColorFormat,
  isUiMode: boolean = false,
) {
  const colorCount = palette.length
  const columns = isUiMode ? Math.min(colorCount, 8) : Math.min(colorCount, 6)
  const rows = isUiMode ? Math.ceil(colorCount / 8) : colorCount > 6 ? 2 : 1
  const outerPadding = 60
  const width = 1920
  const largeFontSize = 64
  const totalSpaces = columns + 1
  const totalPadding = totalSpaces * outerPadding
  const squareSize = (width - totalPadding) / columns
  // Header height: largeFontSize + 60 + 36, plus padding above and below
  const headerHeight = largeFontSize + 60 + 36 + outerPadding
  const height = headerHeight + rows * squareSize + (rows + 1) * outerPadding

  function createHeader(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'black'
    ctx.font = `bold ${largeFontSize}px system-ui`
    ctx.fillText(colorNames.fetchedData?.paletteTitle || 'Palette', outerPadding, outerPadding + largeFontSize)
    ctx.font = '18px system-ui'
    ctx.fillText(
      `Based on ${baseColor?.string} from ${document.location.href} on ${new Date().toLocaleString()}.`,
      outerPadding,
      outerPadding + largeFontSize + 36,
    )
  }

  function createFrame() {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      createHeader(ctx)
      palette.forEach((color, idx) => {
        const row = Math.floor(idx / columns)
        const col = idx % columns
        const x = outerPadding + col * (squareSize + outerPadding)
        const y = headerHeight + outerPadding + row * (squareSize + outerPadding)
        ctx.fillStyle = color.string
        ctx.fillRect(x, y, squareSize, squareSize)
        ctx.fillStyle = color.contrast

        // Handle text sizing and wrapping for UI mode
        if (isUiMode) {
          const colorName = color.code
          const maxWidth = squareSize * 0.9
          ctx.font = 'bold 12px system-ui'

          // Check if text fits, if not, try to wrap or truncate
          const textWidth = ctx.measureText(colorName).width
          if (textWidth > maxWidth) {
            // Try to break at hyphens for long UI names
            const parts = colorName.split('-')
            if (parts.length > 1) {
              const firstLine = parts[0]
              const secondLine = parts.slice(1).join('-')

              ctx.fillText(firstLine, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05 - 40))
              ctx.fillText(secondLine, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05 - 25))
            } else {
              // Single word too long, use smaller font
              ctx.font = 'bold 10px system-ui'
              ctx.fillText(colorName, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05 - 27))
            }
          } else {
            ctx.fillText(colorName, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05 - 27))
          }
        } else {
          ctx.font = 'bold 18px system-ui'
          ctx.fillText(
            colorNames.fetchedData?.colorNames[idx] || '',
            x + squareSize * 0.05,
            y + (squareSize - squareSize * 0.05 - 27),
          )
        }

        const colorValue = color.conversions[colorFormat].value
        if (isUiMode) {
          const maxWidth = squareSize * 0.9
          ctx.font = '12px system-ui'

          const valueWidth = ctx.measureText(colorValue).width
          if (valueWidth > maxWidth) {
            // Use smaller font for long color values
            ctx.font = '10px system-ui'
            const smallValueWidth = ctx.measureText(colorValue).width
            if (smallValueWidth > maxWidth) {
              // If still too long, use even smaller font
              ctx.font = '8px system-ui'
            }
          }
          ctx.fillText(colorValue, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05))
        } else {
          ctx.font = '16px system-ui'
          ctx.fillText(colorValue, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05))
        }
      })
    }
    return canvas
  }
  if (!baseColor) return
  const canvas = createFrame()
  const dataUrl = canvas.toDataURL('image/png')
  const dlLink = document.createElement('a')
  dlLink.href = dataUrl
  dlLink.download = `${
    colorNames.fetchedData?.paletteTitle?.toLowerCase().replace(/\W/g, '-') || 'color-palette-pro'
  }.png`
  document.body.appendChild(dlLink)
  dlLink.click()
  document.body.removeChild(dlLink)
}

function hexContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.5 ? 'black' : 'white'
}

function downloadCodeThemeAsImage(
  theme: CodeThemeOutput,
  keyColors: Array<[string, string]>,
  baseColorString: string,
  colorFormat: ColorFormat,
  cb: (msg: string, type: 'success' | 'error') => void,
) {
  const colorCount = keyColors.length
  const columns = Math.min(colorCount, 8)
  const rows = Math.ceil(colorCount / columns)
  const outerPadding = 60
  const width = 1920
  const largeFontSize = 64
  const totalSpaces = columns + 1
  const totalPadding = totalSpaces * outerPadding
  const squareSize = (width - totalPadding) / columns
  const headerHeight = largeFontSize + 60 + 36 + outerPadding
  const height = headerHeight + rows * squareSize + (rows + 1) * outerPadding

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'black'
  ctx.font = `bold ${largeFontSize}px system-ui`
  ctx.fillText(theme.displayName, outerPadding, outerPadding + largeFontSize)
  ctx.font = '18px system-ui'
  ctx.fillText(
    `Based on ${baseColorString} from ${document.location.href} on ${new Date().toLocaleString()}.`,
    outerPadding,
    outerPadding + largeFontSize + 36,
  )

  keyColors.forEach(([label, hex], idx) => {
    const row = Math.floor(idx / columns)
    const col = idx % columns
    const x = outerPadding + col * (squareSize + outerPadding)
    const y = headerHeight + outerPadding + row * (squareSize + outerPadding)

    ctx.fillStyle = hex
    ctx.fillRect(x, y, squareSize, squareSize)

    const contrastColor = hexContrastColor(hex)
    ctx.fillStyle = contrastColor

    const maxWidth = squareSize * 0.9
    ctx.font = 'bold 12px system-ui'
    if (ctx.measureText(label).width > maxWidth) ctx.font = 'bold 10px system-ui'
    ctx.fillText(label, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05 - 27))

    let colorValue = hex
    if (colorFormat !== 'hex') {
      try {
        colorValue = new Color(hex).toString({ format: colorFormat as any, precision: 3 })
      } catch {
        /* keep hex */
      }
    }
    ctx.font = '12px system-ui'
    if (ctx.measureText(colorValue).width > maxWidth) ctx.font = '10px system-ui'
    ctx.fillText(colorValue, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05))
  })

  const dataUrl = canvas.toDataURL('image/png')
  const dlLink = document.createElement('a')
  dlLink.href = dataUrl
  dlLink.download = `${theme.name || 'theme'}.png`
  document.body.appendChild(dlLink)
  dlLink.click()
  document.body.removeChild(dlLink)
  cb('Preview created', 'success')
}

function downloadCodeTheme(
  theme: CodeThemeOutput,
  paletteTitle: string,
  cb: (msg: string, type: 'success' | 'error') => void,
) {
  const json = JSON.stringify(theme, null, 2)
  const filename = `${paletteTitle?.toLowerCase().replace(/\W/g, '-') || 'color-palette-pro'}.json`
  const blob = new Blob([json], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  cb('Theme downloaded', 'success')
}

function copyCodeTheme(theme: CodeThemeOutput, cb: (msg: string, type: 'success' | 'error') => void) {
  const json = JSON.stringify(theme, null, 2)
  navigator.clipboard.writeText(json)
  cb('Theme copied', 'success')
}

interface ExportOptionsProps {
  fetchedData: { colorNames: string[]; paletteTitle: string; baseColorName: string } | null
  isLoading: boolean
  error: Error | null
  colorFormat: ColorFormat
}

export function ExportOptions({ fetchedData, isLoading, error, colorFormat }: ExportOptionsProps) {
  const { palette, originalColor, mode, paletteStyle, codeTheme } = useContext(ColorContext)
  const { showMessage } = useContext(MessageContext)

  const colorNames = { fetchedData, isLoading, error }

  function handleCopyToClipboard() {
    if (mode === 'code') {
      if (codeTheme) copyCodeTheme(codeTheme, showMessage)
      return
    }
    const paletteAsCss = generateCssVariables(palette, {
      format: colorFormat,
      isUiMode: mode === 'ui',
      style: paletteStyle,
    })
    navigator.clipboard.writeText(paletteAsCss)
    showMessage('Palette copied', 'success')
  }

  function handleImageDownload() {
    if (mode === 'code') {
      if (!codeTheme) return

      const scopes: Record<string, string> = {}
      for (const rule of codeTheme.tokenColors) {
        const fg = rule.settings.foreground
        if (!fg) continue
        const scopeList = Array.isArray(rule.scope) ? rule.scope : [rule.scope || '']
        for (const s of scopeList) {
          if (s && !scopes[s]) scopes[s] = fg
        }
      }

      const keyColors: Array<[string, string]> = [
        ['Editor BG', codeTheme.colors['editor.background'] || '#1e1e1e'],
        ['Editor FG', codeTheme.colors['editor.foreground'] || '#d4d4d4'],
        ['Sidebar', codeTheme.colors['sideBar.background'] || '#181818'],
        ['Status Bar', codeTheme.colors['statusBar.background'] || '#007acc'],
        ['Focus Border', codeTheme.colors['focusBorder'] || '#007acc'],
        ['Input BG', codeTheme.colors['input.background'] || '#1e1e1e'],
        ['Comment', scopes['comment'] || '#6a9955'],
        ['Definition', scopes['entity.name.function'] || '#569cd6'],
        ['String', scopes['string'] || '#ce9178'],
        ['Number', scopes['constant.numeric'] || '#b5cea8'],
      ]

      downloadCodeThemeAsImage(codeTheme, keyColors, originalColor?.string || 'unknown', colorFormat, showMessage)
      return
    }
    downloadPaletteAsImage(originalColor, palette, colorNames, colorFormat, mode === 'ui')
    showMessage('Image created', 'success')
  }

  function handleFileDownload() {
    if (mode === 'code') {
      if (codeTheme)
        downloadCodeTheme(codeTheme, colorNames.fetchedData?.paletteTitle || 'color-palette-pro', showMessage)
      return
    }
    downloadAction(
      palette,
      colorNames.fetchedData?.paletteTitle || 'Palette',
      colorFormat,
      mode === 'ui',
      paletteStyle,
      showMessage,
    )
  }

  return (
    <div className="export-options-container">
      <Button handler={handleImageDownload} active={false}>
        <ImageIcon size={22} color="url(#image-gradient)" weight="fill">
          <LinearGradientSVG id="image-gradient" />
        </ImageIcon>
      </Button>
      <Button handler={handleFileDownload} active={false}>
        <FileArrowDownIcon size={22} color="url(#file-arrow-down-gradient)" weight="fill">
          <LinearGradientSVG id="file-arrow-down-gradient" />
        </FileArrowDownIcon>
      </Button>
      <Button handler={handleCopyToClipboard} active={false}>
        <ClipboardTextIcon size={22} color="url(#copy-gradient)" weight="fill">
          <LinearGradientSVG id="copy-gradient" />
        </ClipboardTextIcon>
      </Button>
      <Button
        handler={() => {
          navigator.clipboard.writeText(document.location.href)
          showMessage('Link copied', 'success')
        }}
        active={false}
      >
        <LinkIcon size={22} color="url(#link-gradient)" weight="bold">
          <LinearGradientSVG id="link-gradient" />
        </LinkIcon>
      </Button>
    </div>
  )
}
