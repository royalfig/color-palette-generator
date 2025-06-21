import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { ColorSpaceAndFormat } from '../../types'
import { container, inputColor } from './input-color-container.module.css'
import { EyedropperSampleIcon, PlayIcon } from '@phosphor-icons/react'
import Button from '../button/Button'
import { ColorContext } from '../ColorContext'

declare global {
  interface Window {
    EyeDropper: any
  }
}

export function InputColorContainer({
  setColor,
  setColorSpace,
  colorSpace,
}: {
  setColor: Dispatch<SetStateAction<string>>
  setColorSpace: React.Dispatch<React.SetStateAction<ColorSpaceAndFormat>>
  colorSpace: ColorSpaceAndFormat
}) {
  const context = useContext(ColorContext)
  const baseColor = context.palette.find(c => c.isBase)
  const [input, setInput] = useState(baseColor?.conversions[colorSpace.format].value)
  const contrast = baseColor?.contrast
  const [active, setActive] = useState(false)

  async function handleEyedropper() {
    const eyeDropper = new window.EyeDropper()
    setActive(true)
    eyeDropper
      .open()
      .then((result: { sRGBHex: string }) => {
        setColorSpace({ space: 'srgb', format: 'hex' })
        setColor(result.sRGBHex)
        setActive(false)
      })
      .catch((e: Error) => {
        console.log(e)
      })
  }

  function handleSubmit() {
    if (input) setColor(input)
  }

  useEffect(() => {
    setInput(baseColor?.conversions[colorSpace.format].value)
  }, [colorSpace, context])

  return (
    <div className={container}>
      {window.EyeDropper ? (
        <Button handler={handleEyedropper} active={active} className="eyedropper-button">
          <EyedropperSampleIcon size={22} color="var(--icon-element)" weight="fill" />
        </Button>
      ) : null}

      <input
        className={inputColor}
        style={
          {
            '--input-bg': baseColor?.string,
            '--input-color': contrast,
          } as React.CSSProperties
        }
        type="text"
        value={input}
        spellCheck={false}
        onChange={e => setInput(e.target.value)}
      />

      <Button handler={handleSubmit} active={false}>
        <PlayIcon size={20} color="var(--icon-element)" weight="fill" />
      </Button>
    </div>
  )
}
