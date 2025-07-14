import { ClipboardTextIcon } from '@phosphor-icons/react/dist/csr/ClipboardText'
import { ImageIcon } from '@phosphor-icons/react/dist/csr/Image'
import { LinkIcon } from '@phosphor-icons/react/dist/csr/Link'
import { FileArrowDownIcon } from '@phosphor-icons/react/dist/csr/FileArrowDown'
import Button from '../components/button/Button'
import './export-options.css'
import { ColorSpace } from 'colorjs.io/fn'
import { ColorName } from '../App'
import { useBaseColor } from '../hooks/useBaseColor'
import { ColorFormat, PaletteKinds } from '../types'
import { color, Color } from 'motion'
import { BaseColorData } from '../util/factory'
import { useContext } from 'react'
import { ColorContext } from '../components/ColorContext'
import { MessageContext } from '../components/MessageContext'
import { LinearGradientSVG } from '../components/LinearGradientSVG'

function downloadAction(
  palette: BaseColorData[],
  paletteTitle: string,
  colorFormat: ColorFormat,
  isUiMode: boolean,
  cb: (msg: string, type: 'success' | 'error') => void,
) {
  const paletteString = palette.map((color, idx) => {
    if (isUiMode) {
      return `  --${color.code}: ${color.conversions[colorFormat].value};
  --${color.code}-contrast: ${color.contrast};`
    }
    return `  --${color.code.substring(0, 3)}-${idx + 1}: ${color.conversions[colorFormat].value};
  --${color.code.substring(0, 3)}-${idx + 1}-contrast: ${color.contrast};`
  })
  const paletteAsCss = ':root {\n' + paletteString.join('\n') + '\n}'
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

function downloadPaletteAsImage(baseColor: BaseColorData, palette: BaseColorData[], colorNames: ColorName, isUiMode: boolean = false) {
  const colorCount = palette.length
  const columns = isUiMode ? Math.min(colorCount, 8) : Math.min(colorCount, 6)
  const rows = isUiMode ? Math.ceil(colorCount / 8) : (colorCount > 6 ? 2 : 1)
  const outerPadding = 60
  const width = 1920
  const fontSize = 20
  const largeFontSize = 64
  const textMargin = 30
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
      `Based on ${baseColor?.string}, from https://colorpalette.pro on ${new Date().toLocaleString()}.`,
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
        
        // Handle color value text sizing for UI mode
        if (isUiMode) {
          const colorValue = color.string
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
          ctx.fillText(color.string, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05))
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

interface ExportOptionsProps {
  fetchedData: { colorNames: string[]; paletteTitle: string; baseColorName: string } | null
  isLoading: boolean
  error: Error | null
  colorFormat: ColorFormat
}

export function ExportOptions({ fetchedData, isLoading, error, colorFormat }: ExportOptionsProps) {
  const { palette, originalColor, isUiMode } = useContext(ColorContext)
  const { showMessage } = useContext(MessageContext)

  const colorNames = { fetchedData, isLoading, error }

  function handleCopyToClipboard() {
    const paletteString = palette.map((color, idx) => {
      if (isUiMode) {
        return `  --${color.code}: ${color.conversions[colorFormat].value};
  --${color.code}-contrast: ${color.contrast};`
      }
      return `  --${color.code.substring(0, 3)}-${idx + 1}: ${color.conversions[colorFormat].value};
  --${color.code.substring(0, 3)}-${idx + 1}-contrast: ${color.contrast};`
    })
    const paletteAsCss = ':root {\n' + paletteString.join('\n') + '\n}'
    navigator.clipboard.writeText(paletteAsCss)
    showMessage('Palette copied', 'success')
  }

  function handleImageDownload() {
    downloadPaletteAsImage(originalColor, palette, colorNames, isUiMode)
    showMessage('Image created', 'success')
  }

  // Image export logic

  return (
    <div className="export-options-container">
      <Button handler={handleImageDownload} active={false}>
        <ImageIcon size={22} color="url(#image-gradient)" weight="fill">
          <LinearGradientSVG id="image-gradient" />
        </ImageIcon>
      </Button>
      <Button
        handler={() => {
          downloadAction(palette, colorNames.fetchedData?.paletteTitle || 'Palette', colorFormat, isUiMode, showMessage)
        }}
        active={false}
      >
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
