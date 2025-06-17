import Color from 'colorjs.io'
import React, { useEffect, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { useBaseColor } from '../../hooks/useBaseColor'
import './color-selector.css'
import { ColorSpace } from '../../types/color-space'
import RangeInput from './RangeInput'

const colorSpaceOptions: Record<ColorSpace, { [key: string]: number[] }> = {
  hex: {
    r: [0, 1],
    g: [0, 1],
    b: [0, 1],
  },
  rgb: {
    r: [0, 1],
    g: [0, 1],
    b: [0, 1],
  },
  hsl: {
    h: [0, 360],
    s: [0, 100],
    l: [0, 100],
  },
  p3: {
    r: [0, 1],
    g: [0, 1],
    b: [0, 1],
  },
  lch: {
    l: [0, 100],
    c: [0, 150],
    h: [0, 360],
  },
  oklch: {
    l: [0, 1],
    c: [0, 0.4],
    h: [0, 360],
  },
  lab: {
    l: [0, 100],
    a: [-125, 125],
    b: [-125, 125],
  },
  oklab: {
    l: [0, 1],
    a: [-0.4, 0.4],
    b: [-0.4, 0.4],
  },
}

export function ColorSelector({
  palettes,
  setColor,
  colorSpace,
}: {
  palettes: any
  setColor: React.Dispatch<React.SetStateAction<string | Color>>
  colorSpace: ColorSpace
}) {
  const currentColor = useBaseColor(palettes)
  const l = currentColor[colorSpace].base.l
  const c = currentColor[colorSpace].base.c
  const color = currentColor.hex.string
  const [values, setValues] = useState(currentColor[colorSpace].raw)

  const colorSpaceRange = colorSpaceOptions[colorSpace]

  useEffect(() => {
    setValues(currentColor[colorSpace].raw)
  }, [currentColor, colorSpace])

  const reconfiguredColorSpace = colorSpace === 'rgb' || colorSpace === 'hex' ? 'srgb' : colorSpace

  const rangeInputs = Object.keys(colorSpaceRange).map((key, idx) => (
    <RangeInput
      key={key}
      label={key}
      min={colorSpaceRange[key][0]}
      max={colorSpaceRange[key][1]}
      step={0.01}
      value={values[idx]}
      onChange={e => {
        const newValues = [...values.slice(0, idx), Number(e.target.value), ...values.slice(idx + 1)]
        setValues(newValues)
        setColor(new Color({ coords: newValues, space: reconfiguredColorSpace }))
      }}
      disabled={colorSpace === 'hex'}
      colorSpace={colorSpace}
      fromColor={`${colorSpace}(${values.join(',')})`}
      toColor={`${colorSpace}(${values.join(',')})`}
    />
  ))

  return <div style={{ '--color-space': colorSpace, '--l': l, '--c': c } as React.CSSProperties}>{rangeInputs}</div>

  // return <HexColorPicker color={color} onChange={setColor} />
}
