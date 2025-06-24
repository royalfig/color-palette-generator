import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { ColorSpaceAndFormat } from '../../types'
import './input-color-container.css'
import { EyedropperSampleIcon, PlayIcon } from '@phosphor-icons/react'
import Button from '../button/Button'
import { ColorContext } from '../ColorContext'
import { MessageContext } from '../MessageContext'
import { LinearGradientSVG } from '../LinearGradientSVG'

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
  const { showMessage } = useContext(MessageContext)
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
        showMessage(`Color set`, 'success')
        setActive(false)
      })
      .catch((e: Error) => {
        console.log(e)
        showMessage('Cancelled', 'info')
      })
  }

  function handleSubmit() {
    if (input) {
      console.log('input', input)
      setColor(input)
      showMessage(`Color set`, 'success')
    }
  }

  useEffect(() => {
    setInput(baseColor?.conversions[colorSpace.format].value)
  }, [colorSpace, context])

  return (
    <div className="input-color-container">
      {window.EyeDropper ? (
        <Button handler={handleEyedropper} active={active} className="eyedropper-button">
          <EyedropperSampleIcon size={22} color="url(#gradient)">
            <LinearGradientSVG />
          </EyedropperSampleIcon>
        </Button>
      ) : null}

      <input
        className="input-color-container-input"
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

      <Button handler={handleSubmit} active={false} className="inverse">
        <PlayIcon size={20}>
          <LinearGradientSVG />
        </PlayIcon>
      </Button>
    </div>
  )
}
