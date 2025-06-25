import { useContext, useEffect, useMemo, useState } from 'react'
import { CaretUpIcon } from '@phosphor-icons/react/dist/csr/CaretUp'
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown'
import { ColorContext } from '../ColorContext'
import { useDebouncedCallback } from 'use-debounce'
import { ColorSpace, SliderType } from '../../types'
import { getSliderStrategy } from './slider-strategies'
import { BaseColorData } from '../../util/factory'

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
  const { min, max, step, label, getValue, updateColor, getTrackStyle, getThumbStyle } = strategy

  const base = context.originalColor

  const initialValue = useMemo(() => getValue(base), [base, getValue])

  const [value, setValue] = useState(initialValue)

  const debouncedColorUpdate = useDebouncedCallback((newValue: number) => {
    const newColor = updateColor(base.color.clone(), newValue)
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

  const workingColor = base.color.clone().to(colorSpace.space).toGamut(colorSpace.space)

  const placeholders = {
    hue: workingColor.h,
    saturation: getSaturation(base, colorSpace.space),
    lightness: getLightness(base, colorSpace.space),
    value: value,
    'lab-a': base.conversions.lab.coords[1],
    'lab-b': base.conversions.lab.coords[2],
    'oklab-a': base.conversions.oklab.coords[1],
    'oklab-b': base.conversions.oklab.coords[2],
    'value-as-percent': value * 100 + '%',
  }

  const thumbColor = getThumbStyle(placeholders)
  const trackStyle = getTrackStyle(placeholders)

  const sliderId = `slider-${label}`

  const dynamicStyles = `
    #${sliderId}::-webkit-slider-runnable-track {
      background: ${trackStyle};
    }
    #${sliderId}::-webkit-slider-thumb {
      background-color: ${thumbColor};
      box-shadow: 0 3px 1px hsl(0deg 0% 0% / 45%), 0 3px 4px hsl(0deg 0% 0% / 25%), 0 -0.5px 0 0.5px color-mix(in oklch, ${thumbColor}, white 75%), 0 0.5px 0 1px color-mix(in oklch, ${thumbColor}, black 75%);
    }
    `

  return (
    <div className="slider">
      <style>{dynamicStyles}</style>
      <div className="flex">
        <label htmlFor={sliderId}>{label}</label>
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
        id={sliderId}
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
