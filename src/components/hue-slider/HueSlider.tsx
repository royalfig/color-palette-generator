import { useContext, useEffect, useState } from 'react'
import './hue-slider.css'
import { CaretUpIcon, CaretDownIcon } from '@phosphor-icons/react'
import { ColorContext } from '../ColorContext'
import { useDebouncedCallback } from 'use-debounce'
import { ColorSpace } from '../../types'
import Color from 'colorjs.io'

function getColorSpace(colorSpace: string) {
  if (colorSpace === 'oklab') return 'oklch'
  if (colorSpace === 'lab') return 'lch'
  if (colorSpace === 'oklch') return 'oklch'
  if (colorSpace === 'lch') return 'lch'

  return 'hsl'
}

function generateThumbStyle(colorSpace: string) {
  if (colorSpace === 'srgb' || colorSpace === 'hsl' || colorSpace === 'p3') {
    return {
      thumbStyle: `hsl(var(--hue) var(--saturation) var(--lightness))`,
      trackStyle: `linear-gradient(to right in hsl longer hue, hsl(0deg var(--saturation) var(--lightness)), hsl(360deg var(--saturation) var(--lightness)))`,
    }
  }

  if (colorSpace === 'oklch' || colorSpace === 'oklab') {
    return {
      thumbStyle: `oklch(var(--lightness) var(--saturation) var(--hue))`,
      trackStyle: `linear-gradient(to right in oklch longer hue, oklch(var(--lightness) var(--saturation) 0deg), oklch(var(--lightness) var(--saturation) 360deg))`,
    }
  }

  return {
    thumbStyle: `lch(var(--lightness) var(--saturation) var(--hue))`,
    trackStyle: `linear-gradient(to right in lch longer hue, lch(var(--lightness) var(--saturation) 0deg), lch(var(--lightness) var(--saturation) 360deg))`,
  }
}

function getSaturation(colorSpace: string, color: Color) {
  console.log(color.oklch.c)
  if (colorSpace === 'oklch' || colorSpace === 'oklab') {
    return color.oklch.c
  }

  if (colorSpace === 'lch' || colorSpace === 'lab') {
    return color.lch.c
  }

  return color.hsl.s
}

export function HueSlider({
  setColor,
  colorSpace,
}: {
  setColor: (color: string) => void
  colorSpace: { format: string; space: ColorSpace }
}) {
  const context = useContext(ColorContext)
  const space = getColorSpace(colorSpace.space)

  const base = context.palette.find(color => color.isBase)!

  const initialHue = Math.round(base.color[space].h)
  const initialSaturation = getSaturation(space, base.color)
  const initialLightness = base?.color[space].l ?? 0
  const [hue, setHue] = useState(initialHue)
  const { thumbStyle, trackStyle } = generateThumbStyle(space)

  const debouncedColorUpdate = useDebouncedCallback((value: number) => {
    const color = context.palette.find(color => color.isBase)!.color
    color[space].h = value
    setColor(color.toString())
  }, 100)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (isNaN(value) || value < 0 || value > 360) {
      return
    }
    setHue(value)
    debouncedColorUpdate(value)
  }

  useEffect(() => {
    setHue(initialHue)
  }, [initialHue])

  const handleIncrement = () => {
    const newValue = hue + 1
    if (newValue > 360) return
    setHue(newValue)
    debouncedColorUpdate(newValue)
  }

  const handleDecrement = () => {
    const newValue = hue - 1
    if (newValue < 0) return
    setHue(newValue)
    debouncedColorUpdate(newValue)
  }

  return (
    <div
      className="hue-slider"
      style={
        {
          '--hue': hue,
          '--saturation': initialSaturation,
          '--lightness': initialLightness,
          '--color-space': space,
          '--thumb-style': thumbStyle,
          '--track-style': trackStyle,
        } as React.CSSProperties
      }
    >
      <div className="flex">
        <label htmlFor="hue-slider">Hue</label>
        <div className="hue-slider-inputs">
          <button onClick={handleIncrement}>
            <CaretUpIcon weight="fill" size={18} />
          </button>
          <input value={hue} onChange={handleChange} size={3} />
          <button onClick={handleDecrement}>
            <CaretDownIcon weight="fill" size={18} />
          </button>
        </div>
      </div>
      <input name="hue-slider" type="range" min="0" max="360" value={hue} onChange={handleChange} />
    </div>
  )
}
