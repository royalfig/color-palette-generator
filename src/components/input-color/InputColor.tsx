import Color from 'colorjs.io'
import { debounce } from 'lodash-es'
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { BaseColorData, ColorSpace } from '../../types'
import './InputColor.css'

export function InputColor({
  setColorspaceType,
  setColor,
  type,
  base,
  setIsActive,
  setError,
  isActive,
}: {
  setColorspaceType: Dispatch<SetStateAction<ColorSpace>>
  setColor: Dispatch<SetStateAction<string | Color>>
  type: ColorSpace
  base: BaseColorData
  setIsActive: Dispatch<SetStateAction<boolean>>
  isActive: boolean
  setError: Dispatch<SetStateAction<string>>
}) {
  const current = base[type].string
  const [inputColor, setInputColor] = useState<string>(current)
  const [prevInputColor, setPrevInputColor] = useState<string>(current)
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
    setError('')
  }, [current])

  const debouncedParseColor = useCallback(debounce(parseColor, 1000), [])

  function parseColor(value: string) {
    console.log('handling change', Date.now())
    try {
      const parsed = new Color(value)
      // setColorspaceType(parsed.spaceId)
      console.log('🚀 ~ file: InputColor.tsx:57 ~ parseColor ~ parsed:', parsed)
      setError('')
      setIsActive(false)
      setColor(parsed)
    } catch (error: any) {
      setInputColor(error.message)
      setIsActive(false)
      setError(error.message)
      return
    }
  }

  function validate(value: string) {
    return value.split(' ').length === 3
  }

  function handleChange(value: string): void {
    setError('')
    setInputColor(value)

    setIsActive(!isActive)

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
    </div>
  )
}
