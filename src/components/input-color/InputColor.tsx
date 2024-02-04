import { BoltIcon, ExclamationTriangleIcon, ScissorsIcon } from '@heroicons/react/24/outline'
import Color from 'colorjs.io'
import { motion } from 'framer-motion'
import { debounce } from 'lodash-es'
import { useCallback, useEffect, useState } from 'react'
import { ColorFactory } from '../../util/factory'
import { Display } from '../display/Display'
import { ColorTypes } from '../input-color-container/InputColorContainer'
import './InputColor.css'

export function InputColor({
  setColorspaceType,
  setColor,
  type,
  base,
}: {
  setColorspaceType: React.Dispatch<React.SetStateAction<ColorTypes>>
  setColor: React.Dispatch<React.SetStateAction<string | Color>>
  type: 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3'
  base: ColorFactory
}) {
  const current = base[type].string
  const [inputColor, setInputColor] = useState<string>(current)
  const [prevInputColor, setPrevInputColor] = useState<string>(current)
  const [warning, setWarning] = useState(false)
  const [activity, setActivity] = useState(false)
  const inGamut = base[type].isInGamut

  console.log('inputColor rendering')

  // if (current !== prevInputColor) {
  //   console.log('🚀 ~ file: InputColor.tsx:30 ~ current !== prevInputColor:', current, prevInputColor)
  //   setInputColor(current)
  //   setPrevInputColor(inputColor)
  //   setWarning(false)
  // }

  useEffect(() => { 
    console.log('🚀 ~ file: InputColor.tsx:30 ~ useEffect render', current, prevInputColor)
    setInputColor(current)
    // setPrevInputColor(inputColor)
    setWarning(false)
  }, [current]);

  const debouncedParseColor = useCallback(debounce(parseColor, 1000), [])

  function parseColor(value: string) {
    console.log('handling change', Date.now())
    try {
      const parsed = new Color(value)
      // setColorspaceType(parsed.spaceId)
      console.log('🚀 ~ file: InputColor.tsx:57 ~ parseColor ~ parsed:', parsed)
      setWarning(false)
      setActivity(false)
      setColor(parsed)
    } catch (error: any) {
      setInputColor(error.message)
      setActivity(false)
      setWarning(true)
      return
    }
  }

  function validate(value: string) {
    return value.split(' ').length === 3
  }

  function handleChange(value: string): void {
    setWarning(false)
    setInputColor(value)

    setActivity(!activity)

    if (value.includes('#') && value.length < 7) return

    if (!value.includes('#') && !validate(value)) {
      return
    }

    debouncedParseColor(value)
  }

  return (
    <div className="input-color flex">
      <label className="sr-only" htmlFor={`input-color-${type}`}>
        {type}
      </label>

      <input
        id={`input-color-${type}`}
        type="text"
        value={inputColor}
        onChange={e => handleChange(e.target.value)}
        spellCheck="false"
      />
      <span className="blur-input">{inputColor}</span>
      <div className="input-color-metadata flex">
        <ScissorsIcon className={!inGamut ? 'clipped' : ''} />
        <ExclamationTriangleIcon className={warning ? 'warning' : ''} />
        {activity ? <LightUpSvg /> : <BoltIcon />}
      </div>
    </div>
  )
}

function LightUpSvg() {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Trigger the animation at random intervals
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 500) // Duration of the light-up effect
    }, Math.random() * 2000) // Random interval between 0 and 2000 milliseconds

    return () => clearInterval(interval)
  }, [])

  const variants = {
    active: { opacity: 1 }, // Light-up effect properties
    inactive: { opacity: 0.7 },
  }

  return (
    <motion.svg
      animate={isAnimating ? 'active' : 'inactive'}
      variants={variants}
      // ... other SVG props
    >
      <BoltIcon style={{ color: 'orange' }} />
    </motion.svg>
  )
}
