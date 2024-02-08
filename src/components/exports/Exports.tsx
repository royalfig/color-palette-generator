import { ColorName } from '../../App'
import Button from '../button/Button'

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
  palettes: any
  palette: string
  variation: string
  colorSpace: string
  colorNames: ColorName
}) {
  const sample = {
    name: 'red',
    hex: '#FF0000',
  }

  const currentPalette = palettes[palette][variation]
  const totalColors = currentPalette.length

  function createFrame() {
    const canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 80 + (totalColors * 40)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#fff'
      ctx.font = '20px system-ui'
      ctx.fillText(colorNames.fetchedData?.paletteTitle || 'Palette', 40, 20)
      ctx.font = '14px system-ui'
      ctx.fillText(`Generated from Color Palette Pro at ${new Date().toLocaleString()}`, 40, 40)
    }

    return { ctx, canvas }
  }

  function handler() {
    const { ctx, canvas } = createFrame()

    if (ctx) {
      for (let idx = 0; idx < totalColors; idx++) {
        ctx.fillStyle = currentPalette[idx][colorSpace].string
        ctx.fillRect(40, 40 + (idx * 40), 40, 360)

        // ctx.fillStyle = currentPalette[0][colorSpace].contrast
        // ctx.font = '20px sans-serif'
        // const colorSpaceWidth = ctx.measureText(currentPalette[0][colorSpace].string).width
        // const colorNameWidth = ctx.measureText(colorNames.fetchedData?.colorNames[0] || "").width

        // ctx.fillText(currentPalette[0][colorSpace].string, 500 - (Math.max(colorNameWidth,colorSpaceWidth) + 30), 500 - 30)
        // ctx.fillText(colorNames.fetchedData?.colorNames[0] || "", 500 - (Math.max(colorNameWidth,colorSpaceWidth) + 30), 500 - 60)
      }
    }

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
