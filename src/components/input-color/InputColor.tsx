import { useContext, useEffect, useState } from 'react'
import Button from '../button/Button'
import './input-color.css'
import { PlayIcon } from '@phosphor-icons/react/dist/csr/Play'
import { ColorFormat, ColorSpace } from '../../types'
import { ColorContext } from '../ColorContext'

export function InputColor({
  color,
  setColor,
  colorSpace,
}: {
  color: string
  setColor: Function
  colorSpace: { space: ColorSpace; format: ColorFormat }
}) {
  const context = useContext(ColorContext)
  const baseColor = context?.palette.find(c => c.isBase)
  const [input, setInput] = useState(baseColor?.conversions[colorSpace.format].value)
  const contrast = baseColor?.contrast

  function handleSubmit() {
    setColor(input)
  }

  useEffect(() => {
    setInput(baseColor?.conversions[colorSpace.format].value)
  }, [colorSpace, context])

  return (
    <div
      className="input-color"
      style={
        {
          '--input-bg': baseColor?.string,
          '--input-color': contrast,
        } as React.CSSProperties
      }
    >
      <input type="text" value={input} onChange={e => setInput(e.target.value)} />
      <Button handler={handleSubmit} active={false}>
        <PlayIcon size={20} color="var(--icon-element)" weight="fill" />
      </Button>
    </div>
  )
}
