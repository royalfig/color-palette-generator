import { ScissorsIcon } from '@heroicons/react/24/outline'
import { formatCss, parse } from 'culori'
import { debounce } from 'lodash-es'
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
    console.log('parsing color')
    const parsed = parse(value)

    if (!parsed && value.length > 3) {
      setWarning(true)
    }

    if (parsed) {
      setWarning(false)
      const parsedAsStr = formatCss(parsed)
      console.log({ parsedAsStr, parsed })
      setColor(parsedAsStr)
    }
  }

  function handleChange(value: string): void {
    console.log('handling chnge')
    setInputColor(value)
    debouncedParseColor(value)
  }

  const clipped = !currentPalette.inGamut && ['rgb', 'hsl', 'hex'].includes(type)

  useEffect(() => {
    setInputColor(currentPalette[type])
  }, [palettes])

  return (
    <div className="input-color">
      <div className="label-group flex">
        <div className='flex gap-2'>
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
