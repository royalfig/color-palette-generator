import { CopyIcon, ImageIcon, LinkIcon, FileArrowDownIcon } from '@phosphor-icons/react'
import Button from '../components/button/Button'
import './export-options.css'
import { ColorSpace } from 'colorjs.io/fn'
import { ColorName } from '../App'
import { useBaseColor } from '../hooks/useBaseColor'
import { PaletteKinds } from '../types'
import { Color } from 'motion'
import { BaseColorData } from '../util/factory'
import { useContext } from 'react'
import { ColorContext } from '../components/ColorContext'
import { MessageContext } from '../components/MessageContext'
import { LinearGradientSVG } from '../components/LinearGradientSVG'

function downloadAction(blobToDownload: string, filename: string, type: string) {
  const blob = new Blob([blobToDownload], { type })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function downloadPaletteAsImage(palette: BaseColorData[], colorNames: ColorName) {
  const baseColor = palette.find(color => color.isBase)
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

function handleCopyToClipboard(palette: BaseColorData[], colorNames: ColorName) {
  const paletteWithNames = palette.map((color, idx) => ({
    name: colorNames.fetchedData?.colorNames[idx],
    [`--${color.code}`]: color.string,
    [`--${color.code}-contrast`]: color.contrast,
  }))
  navigator.clipboard.writeText(JSON.stringify(paletteWithNames, null, 2))
}

interface ExportOptionsProps {
  fetchedData: { colorNames: string[]; paletteTitle: string; baseColorName: string } | null
  isLoading: boolean
  error: Error | null
}

export function ExportOptions({ fetchedData, isLoading, error }: ExportOptionsProps) {
  const { palette } = useContext(ColorContext)
  const { showMessage } = useContext(MessageContext)

  const colorNames = { fetchedData, isLoading, error }

  function handleCopyToClipboard() {
    navigator.clipboard.writeText(JSON.stringify(palette, null, 2))
    showMessage('Palette copied', 'success')
  }

  function handleImageDownload() {
    downloadPaletteAsImage(palette, colorNames)
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
      <Button handler={() => {}} active={false}>
        <FileArrowDownIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </FileArrowDownIcon>
      </Button>
      <Button handler={handleCopyToClipboard} active={false}>
        <CopyIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </CopyIcon>
      </Button>
      <Button handler={() => {}} active={false}>
        <LinkIcon size={20} color="url(#gradient)">
          <LinearGradientSVG />
        </LinkIcon>
      </Button>
    </div>
  )
}
