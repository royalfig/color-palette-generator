import { CSSProperties, useContext, useEffect, useMemo, useState } from 'react'
import { CaretUpIcon, CaretDownIcon } from '@phosphor-icons/react'
import { ColorContext } from '../ColorContext'
import { useDebouncedCallback } from 'use-debounce'
import { ColorSpace, SliderType } from '../../types'
import Color from 'colorjs.io'
import { getSliderStrategy } from './slider-strategies'
import { BaseColorData } from '../../util/factory'

interface SliderStyle extends CSSProperties {
  '--hue': number
  '--saturation': string | number
  '--lightness': string | number
  '--track-style': string
  '--thumb-style': string
  '--value': number
  '--r': number
  '--g': number
  '--b': number
  '--p3-r': number
  '--p3-g': number
  '--p3-b': number
  '--lab-a': number
  '--lab-b': number
  '--oklab-a': number
  '--oklab-b': number
  '--value-as-percent': string
}

export function Slider({
  setColor,
  colorSpace,
  type,
}: {
  setColor: React.Dispatch<React.SetStateAction<string>>
  colorSpace: { format: string; space: ColorSpace }
  type: SliderType
}) {
  const context = useContext(ColorContext)
  const strategy = getSliderStrategy(type, colorSpace.space)
  const { min, max, step, label, getValue, updateColor, getTrackStyle } = strategy

  const base = context.palette.find(color => color.isBase)!

  const initialValue = useMemo(() => getValue(base), [base.color, getValue])

  const [value, setValue] = useState(initialValue)

  const debouncedColorUpdate = useDebouncedCallback((newValue: number) => {
    const newColor = updateColor(base.color.clone(), newValue)
    console.log(newColor, newValue)
    setColor(newColor.toString())
  }, 100)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = Number(e.target.value)
    if (isNaN(numValue) || numValue < min || numValue > max) {
      return
    }
    setValue(numValue)
    debouncedColorUpdate(numValue)
  }

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleIncrement = () => {
    const newValue = value + (step ?? 1)
    if (newValue > max) return
    setValue(newValue)
    debouncedColorUpdate(newValue)
  }

  const handleDecrement = () => {
    const newValue = value - (step ?? 1)
    if (newValue < min) return
    setValue(newValue)
    debouncedColorUpdate(newValue)
  }

  function getLightness(base: BaseColorData, space: ColorSpace) {
    if (space === 'oklab') return base.conversions.oklab.coords[0]
    if (space === 'oklch') return base.conversions.oklch.coords[0]
    if (space === 'lab') return base.conversions.lab.coords[0]
    if (space === 'lch') return base.conversions.lch.coords[0]
    return base.conversions.hsl.coords[2]
  }

  function getSaturation(base: BaseColorData, space: ColorSpace) {
    if (space === 'oklab') return base.conversions.oklab.coords[1]
    if (space === 'oklch') return base.conversions.oklch.coords[1]
    if (space === 'lab') return base.conversions.lab.coords[1]
    if (space === 'lch') return base.conversions.lch.coords[1]
    return base.conversions.hsl.coords[1]
  }

  const thumbColor = strategy.thumbStyle
  const trackStyle = getTrackStyle(base.color)

  const workingColor = base.color.clone().to(colorSpace.space).toGamut(colorSpace.space)

  const style: SliderStyle = {
    '--track-style': trackStyle,
    '--thumb-style': thumbColor,
    '--hue': workingColor.h,
    '--saturation': getSaturation(base, colorSpace.space),
    '--lightness': getLightness(base, colorSpace.space),
    '--value': value,
    '--r': base.color.srgb.r * 100,
    '--g': base.color.srgb.g * 100,
    '--b': base.color.srgb.b * 100,
    '--p3-r': base.conversions.p3.coords[0],
    '--p3-g': base.conversions.p3.coords[1],
    '--p3-b': base.conversions.p3.coords[2],
    '--lab-a': base.conversions.lab.coords[1],
    '--lab-b': base.conversions.lab.coords[2],
    '--oklab-a': base.conversions.oklab.coords[1],
    '--oklab-b': base.conversions.oklab.coords[2],
    '--value-as-percent': colorSpace.space === 'srgb' ? value + '%' : (value * 100).toFixed(2) + '%',
  }

  return (
    <div className="slider" style={style}>
      <div className="flex">
        <label htmlFor={`slider-${label}`}>{label}</label>
        <div className="slider-inputs">
          <button onClick={handleIncrement}>
            <CaretUpIcon weight="fill" size={16} />
          </button>
          <label htmlFor={`slider-input-${label}`} className="sr-only">
            number input
          </label>
          <input name="slider-input" id={`slider-input-${label}`} value={value} onChange={handleChange} size={5} />
          <button onClick={handleDecrement}>
            <CaretDownIcon weight="fill" size={16} />
          </button>
        </div>
      </div>
      <input
        name="slider"
        id={`slider-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}
