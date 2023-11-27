import { ScissorsIcon } from '@heroicons/react/24/outline'
import { debounce } from 'lodash-es'
import { useCallback, useEffect, useState } from 'react'
import { Schemes } from '../../util/palettes'
import './InputColor.css'
import Color from 'colorjs.io'

export function InputColor({
  palettes,
  setColor,
  type,
}: {
  palettes: Schemes
  setColor: React.Dispatch<React.SetStateAction<string | Color>>
  type: 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3'
}) {
  // const current = palettes.complementary.original[0][type].string;
  
  const [inputColor, setInputColor] = useState<Schemes | string>(palettes)
  const [prevColor, setPrevColor] = useState(palettes)

  console.log('rendering input el', Date.now())

  // useEffect(() => {
  //   console.log('EFFECT setting input color', Date.now())
  //   setInputColor(palettes.complementary.original[0][type].string)
  // }, [palettes])

  if (palettes !== prevColor) {
    setInputColor(palettes)
    setPrevColor(palettes)
    console.log("prev don't match", palettes, prevColor)
  }

  
  const string = palettes.complementary.original[0][type].string
  const inGamut = palettes.complementary.original[0][type].isInGamut
  const [warning, setWarning] = useState(false)

  const debouncedParseColor = useCallback(debounce(parseColor, 1000), [])

  function parseColor(value: string) {
    console.log('parsing color', Date.now())

    try {
      const parsed = new Color(value)
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
    console.log('handling change', Date.now())
    setWarning(false)
    setInputColor(value)

    if (type === 'hex' && value.length < 7) return

    if (type !== 'hex' && !validate(value)) {
      console.log('dont match')
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
        value={string}
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
