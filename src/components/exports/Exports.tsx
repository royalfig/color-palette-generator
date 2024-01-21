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

export function ExportImage() {
  return (
    <Button handler={() => console.log('image download')} active={false}>
      Image
    </Button>
  )
}

export function ExportJSON({ data }: { data: any }) {
  console.log(data)
  const json = JSON.stringify(data, null, 2)
  return (
    <Button handler={() => downloadAction(json, 'color-palette-pro.json', 'text/json')} active={false}>
      JSON
    </Button>
  )
}
