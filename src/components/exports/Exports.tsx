import { create } from 'lodash-es'
import { ColorName } from '../../App'
import { ColorSpace, PaletteKinds, Palettes, VariationKinds } from '../../types'
import Button from '../button/Button'
import { useBaseColor } from '../../hooks/useBaseColor'

function downloadAction(blobToDownload: string, filename: string, type: string) {
  const blob = new Blob([blobToDownload], { type })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function ExportCSS({ css }: { css: string }) {
  const stylesheet = `:root {\n${css}}\n`

  return (
    <Button handler={() => downloadAction(stylesheet, 'color-palette-pro.css', 'text/css')} active={false}>
      CSS
    </Button>
  )
}

export function ExportImage({
  palettes,
  palette,
  variation,
  colorSpace,
  colorNames,
}: {
  palettes: Palettes
  palette: PaletteKinds
  variation: VariationKinds
  colorSpace: ColorSpace
  colorNames: ColorName
}) {
  const current = useBaseColor(palettes)
  const currentPalette = palettes[palette][variation]
  const totalColors = currentPalette.length > 5 ? 5 : currentPalette.length
  const outerPadding = 60
  const width = 1920
  const fontSize = 20
  const largeFontSize = 64
  const textMargin = 30
  const totalSpaces = totalColors + 1
  const totalPadding = totalSpaces * outerPadding
  const squareSize = (width - totalPadding) / totalColors
  const height = 64 + 60 + 36 + outerPadding * 2 + (outerPadding + squareSize) * (currentPalette.length > 5 ? 2 : 1)
  function createHeader(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'black'

    ctx.font = `bold ${largeFontSize}px system-ui`
    ctx.fillText(colorNames.fetchedData?.paletteTitle || 'Palette', outerPadding, outerPadding + largeFontSize) // 64 + 60

    ctx.font = '18px system-ui'
    ctx.fillText(
      `Based on ${current[colorSpace].string}, from https://colorpalette.pro on ${new Date().toLocaleString()}.`,
      outerPadding,
      outerPadding + largeFontSize + 36,
    ) // 64 + 60 + 36
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

      let last = 0

      currentPalette.forEach((color, idx) => {
        console.log({ idx, size: outerPadding + idx * (squareSize + outerPadding) })
        let x = outerPadding + last
        let y = 64 + 60 + 36 + outerPadding

        if (idx > 4) {
          if (idx === 5) {
            last = 0
          }
          y += outerPadding + squareSize
          x = outerPadding + last
        }

        ctx.fillStyle = color[colorSpace].string
        ctx.fillRect(x, y, squareSize, squareSize)
        ctx.fillStyle = color[colorSpace].contrast
        ctx.font = 'bold 18px system-ui'
        ctx.fillText(colorNames.fetchedData?.colorNames[idx] || "", x + (squareSize * .05), y + (squareSize - (squareSize * .05) - 27))
        ctx.font = '16px system-ui'
        ctx.fillText(color[colorSpace].string, x + (squareSize * .05), y + (squareSize - (squareSize * .05)))
        last = x + squareSize
      })
    }

    return canvas
  }

  function handler() {
    const canvas = createFrame()

    const dataUrl = canvas.toDataURL('image/png')
    const dlLink = document.createElement('a')
    dlLink.href = dataUrl
    dlLink.download = `${
      colorNames.fetchedData?.paletteTitle.toLowerCase().replace(/\W/g, '-') || 'color-palette-pro'
    }.png`

    document.body.appendChild(dlLink)
    dlLink.click()
    document.body.removeChild(dlLink)
  }

  return (
    <Button handler={handler} active={false}>
      Image
    </Button>
  )
}

export function ExportJSON({ data }: { data: any }) {
  const json = JSON.stringify(data, null, 2)
  return (
    <Button handler={() => downloadAction(json, 'color-palette-pro.json', 'text/json')} active={false}>
      JSON
    </Button>
  )
}
