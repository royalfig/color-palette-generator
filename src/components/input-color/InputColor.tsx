import { useEffect, useState } from 'react'
import './InputColor.css'
import { ScissorsIcon } from '@heroicons/react/24/outline'
import { parse } from 'culori'
import { useCurrentColor } from '../../hooks/useCurrentColor'
import { formatCss } from 'culori'
import { debounce } from 'lodash-es'

export function InputColor({
  palettes,
  setColor,
  type,
}: {
  palettes: any
  setColor: React.Dispatch<React.SetStateAction<string>>
  type: 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab' | 'oklab'
}) {
  const currentPalette = useCurrentColor(palettes)

  const [inputColor, setInputColor] = useState(currentPalette[type])
  const [warning, setWarning] = useState(false)

  const debouncedParseColor = debounce(parseColor, 500)

  function parseColor(value: string) {
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
        <div>
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
