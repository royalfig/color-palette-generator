import { useContext, useEffect, useMemo, useState, memo } from 'react'
import { CaretUpIcon } from '@phosphor-icons/react/dist/csr/CaretUp'
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown'
import { ColorContext } from '../ColorContext'
import { useDebouncedCallback } from 'use-debounce'
import { ColorSpace, SliderType } from '../../types'
import { getSliderStrategy } from './slider-strategies'
import { BaseColorData } from '../../util/factory'

// Move helper functions outside component to avoid recreation
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

export const Slider = memo(function Slider({
  setColor,
  colorSpace,
  type,
}: {
  setColor: React.Dispatch<React.SetStateAction<string>>
  colorSpace: { format: string; space: ColorSpace }
  type: SliderType
}) {
  const context = useContext(ColorContext)
  const strategy = useMemo(() => getSliderStrategy(type, colorSpace.space), [type, colorSpace.space])
  const { min, max, step, label, getValue, updateColor, getTrackStyle, getThumbStyle } = strategy

  const base = context.originalColor

  const initialValue = useMemo(() => getValue(base), [base, getValue])

  const [value, setValue] = useState(initialValue)
  const [inputValue, setInputValue] = useState(String(initialValue))

  const debouncedColorUpdate = useDebouncedCallback((newValue: number) => {
    const newColor = updateColor(base.color.clone(), newValue)
    setColor(newColor.to(colorSpace.space).toString({ precision: 3 }))
  }, 100)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setInputValue(input)

    const numValue = parseFloat(input)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      setValue(numValue)
      debouncedColorUpdate(numValue)
    }
  }

  useEffect(() => {
    setValue(initialValue)
    setInputValue(String(initialValue))
  }, [initialValue])

  const handleIncrement = () => {
    const increment = step ?? 1
    const newValue = value + increment
    if (newValue > max) return

    // Round to the same decimal places as the step
    const decimalPlaces = increment.toString().split('.')[1]?.length || 0
    const roundedValue = Math.round(newValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)

    setValue(roundedValue)
    setInputValue(String(roundedValue))
    debouncedColorUpdate(roundedValue)
  }

  const handleDecrement = () => {
    const decrement = step ?? 1
    const newValue = value - decrement
    if (newValue < min) return

    // Round to the same decimal places as the step
    const decimalPlaces = decrement.toString().split('.')[1]?.length || 0
    const roundedValue = Math.round(newValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)

    setValue(roundedValue)
    setInputValue(String(roundedValue))
    debouncedColorUpdate(roundedValue)
  }

  // Memoize expensive color calculations
  const workingColor = useMemo(
    () => base.color.clone().to(colorSpace.space).toGamut(colorSpace.space),
    [base.color, colorSpace.space],
  )

  // Memoize placeholders object to avoid recreation
  const placeholders = useMemo(
    () => ({
      hue: workingColor.h,
      saturation: getSaturation(base, colorSpace.space),
      lightness: getLightness(base, colorSpace.space),
      value: value,
      'lab-a': base.conversions.lab.coords[1],
      'lab-b': base.conversions.lab.coords[2],
      'oklab-a': base.conversions.oklab.coords[1],
      'oklab-b': base.conversions.oklab.coords[2],
      'value-as-percent': value * 100 + '%',
    }),
    [workingColor, base, colorSpace.space, value],
  )

  // Memoize style calculations
  const thumbColor = useMemo(() => getThumbStyle(placeholders), [placeholders, getThumbStyle])
  const trackStyle = useMemo(() => getTrackStyle(placeholders), [placeholders, getTrackStyle])

  const sliderId = `slider-${label}`

  // Memoize dynamic styles to avoid recreating on every render
  const dynamicStyles = useMemo(
    () => `
    #${sliderId}::-webkit-slider-runnable-track {
      background: ${trackStyle};
    }
    #${sliderId}::-webkit-slider-thumb {
      background-color: ${thumbColor};
      box-shadow: 0 3px 1px hsl(0deg 0% 0% / 45%), 0 3px 4px hsl(0deg 0% 0% / 25%), 0 -0.5px 0 0.5px color-mix(in oklch, ${thumbColor}, white 75%), 0 0.5px 0 1px color-mix(in oklch, ${thumbColor}, black 75%);
    }
    #${sliderId}::-moz-range-thumb {
      background-color: ${thumbColor};
      box-shadow: 0 3px 1px hsl(0deg 0% 0% / 45%), 0 3px 4px hsl(0deg 0% 0% / 25%), 0 -0.5px 0 0.5px color-mix(in oklch, ${thumbColor}, white 75%), 0 0.5px 0 1px color-mix(in oklch, ${thumbColor}, black 75%);
    }
    #${sliderId}::-moz-range-track {
      background: ${trackStyle};
    }
    `,
    [sliderId, thumbColor, trackStyle],
  )

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
          <input
            name="slider-input"
            id={`slider-input-${label}`}
            type="text"
            value={inputValue}
            onChange={handleChange}
          />
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
})
