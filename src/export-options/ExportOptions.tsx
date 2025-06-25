import { CopyIcon } from '@phosphor-icons/react/dist/csr/Copy'
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
  cb: (msg: string, type: 'success' | 'error') => void,
) {
  const paletteString = palette.map((color, idx) => {
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

function downloadPaletteAsImage(baseColor: BaseColorData, palette: BaseColorData[], colorNames: ColorName) {
  const colorCount = palette.length
  const columns = Math.min(colorCount, 6)
  const rows = colorCount > 6 ? 2 : 1
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
      palette.slice(0, 12).forEach((color, idx) => {
        const row = Math.floor(idx / 6)
        const col = idx % 6
        const x = outerPadding + col * (squareSize + outerPadding)
        const y = headerHeight + outerPadding + row * (squareSize + outerPadding)
        ctx.fillStyle = color.string
        ctx.fillRect(x, y, squareSize, squareSize)
        ctx.fillStyle = color.contrast
        ctx.font = 'bold 18px system-ui'
        ctx.fillText(
          colorNames.fetchedData?.colorNames[idx] || '',
          x + squareSize * 0.05,
          y + (squareSize - squareSize * 0.05 - 27),
        )
        ctx.font = '16px system-ui'
        ctx.fillText(color.string, x + squareSize * 0.05, y + (squareSize - squareSize * 0.05))
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
  const { palette, originalColor } = useContext(ColorContext)
  const { showMessage } = useContext(MessageContext)

  const colorNames = { fetchedData, isLoading, error }

  function handleCopyToClipboard() {
    const paletteString = palette.map((color, idx) => {
      return `  --${color.code.substring(0, 3)}-${idx + 1}: ${color.conversions[colorFormat].value};
  --${color.code.substring(0, 3)}-${idx + 1}-contrast: ${color.contrast};`
    })
    const paletteAsCss = ':root {\n' + paletteString.join('\n') + '\n}'
    navigator.clipboard.writeText(paletteAsCss)
    showMessage('Palette copied', 'success')
  }

  function handleImageDownload() {
    downloadPaletteAsImage(originalColor, palette, colorNames)
    showMessage('Image created', 'success')
  }

  // Image export logic

  return (
    <div className="export-options-container">
      <Button handler={handleImageDownload} active={false}>
        <ImageIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </ImageIcon>
      </Button>
      <Button
        handler={() => {
          downloadAction(palette, colorNames.fetchedData?.paletteTitle || 'Palette', colorFormat, showMessage)
        }}
        active={false}
      >
        <FileArrowDownIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </FileArrowDownIcon>
      </Button>
      <Button handler={handleCopyToClipboard} active={false}>
        <CopyIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </CopyIcon>
      </Button>
      <Button
        handler={() => {
          navigator.clipboard.writeText(document.location.href)
          showMessage('Link copied', 'success')
        }}
        active={false}
      >
        <LinkIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </LinkIcon>
      </Button>
    </div>
  )
}
