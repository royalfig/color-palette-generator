import { create } from 'lodash-es'
import { ColorName } from '../../App'
import { ColorSpace, PaletteKinds, Palettes, VariationKinds } from '../../types'
import Button from '../button/Button'
import { useBaseColor } from '../../hooks/useBaseColor'

export function ExportCSS({ css }: { css: string }) {
  const stylesheet = `:root {\n${css}}\n`

  return (
    <Button handler={() => downloadAction(stylesheet, 'color-palette-pro.css', 'text/css')} active={false}>
      CSS
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
