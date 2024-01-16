import { ScissorsIcon } from '@heroicons/react/24/outline'
import Color from 'colorjs.io'
import { debounce } from 'lodash-es'
import { useCallback, useState } from 'react'
import './InputColor.css'
import { ColorFactory } from '../../util/factory'
import { ColorTypes } from '../input-color-container/InputColorContainer'

export function InputColor({
  setColorspaceType,
  setColor,
  type,
  base
}: {
  setColorspaceType: React.Dispatch<React.SetStateAction<ColorTypes>>
  setColor: React.Dispatch<React.SetStateAction<string | Color>>
  type: 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3',
  base: ColorFactory
}) {
  const current = base[type].string
  const [inputColor, setInputColor] = useState<string>(current)
  const [prevInputColor, setPrevInputColor] = useState<string>(current)
  const [warning, setWarning] = useState(false)
  const inGamut = base[type].isInGamut

  console.log('inputColor rendering')
  
  if (current !== prevInputColor) {
    console.log("🚀 ~ file: InputColor.tsx:30 ~ current !== prevInputColor:", current, prevInputColor)
    setInputColor(current)
    setPrevInputColor(inputColor)
  }

  const debouncedParseColor = useCallback(debounce(parseColor, 1000), [])

  function parseColor(value: string) {
    console.log('handling change', Date.now())
    try {
      const parsed = new Color(value)
      // setColorspaceType(parsed.spaceId)
      console.log("🚀 ~ file: InputColor.tsx:57 ~ parseColor ~ parsed:", parsed)
      setWarning(false)
      setColor(parsed)
    } catch (error) {
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
      <div className="input-color-metadata">
        {!inGamut ? <ScissorsIcon className="clipped-icon" /> : undefined}
        {warning ? <div className="warning">Color not parsed</div> : undefined}
      </div>
    </div>
  )
}
