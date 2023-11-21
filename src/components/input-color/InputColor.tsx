import { ScissorsIcon } from '@heroicons/react/24/outline'
import { formatCss, parse } from 'culori'
import { debounce, set } from 'lodash-es'
import { useCallback, useEffect, useState } from 'react'
import { useCurrentColor } from '../../hooks/useCurrentColor'
import './InputColor.css'

export function InputColor({
  palettes,
  setColor,
  type,
}: {
  palettes: any
  setColor: React.Dispatch<React.SetStateAction<string>>
  type: 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab' | 'p3'
}) {
  const currentPalette = useCurrentColor(palettes)

  const [inputColor, setInputColor] = useState(currentPalette[type])
  const [warning, setWarning] = useState(false)

  const debouncedParseColor = useCallback(debounce(parseColor, 1000), [])

  function parseColor(value: string) {
    console.log('parsing color', Date.now())
    const parsed = parse(value)

    if (!parsed) {
      setWarning(true)
      return;
    }

    if (parsed) {
      setWarning(false)
      const parsedAsStr = formatCss(parsed)
      console.log({ parsedAsStr, parsed })
      setColor(parsedAsStr)
    }
  }

  function validate(value: string) {

    if (['rgb', 'hsl'].includes(type)) {
      return value.split(',').length === 3
    } else {
      return value.split(' ').length === 3
    }
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

  const clipped = !currentPalette.inGamut && ['rgb', 'hsl', 'hex'].includes(type)

  useEffect(() => {
    setInputColor(currentPalette[type])
  }, [palettes])

  return (
    <div className="input-color">
      <div className="label-group flex">
        <div className="flex gap-2">
          <label htmlFor={`input-color-${type}`}>{type}</label>{' '}
          {clipped ? <ScissorsIcon className="clipped-icon" /> : undefined}
        </div>
        {warning ? <div className="warning">Color not parsed</div> : undefined}
      </div>
      <input
        id={`input-color-${type}`}
        type="text"
        value={inputColor}
        onChange={e => handleChange(e.target.value)}
        spellCheck="false"
      />
    </div>
  )
}
