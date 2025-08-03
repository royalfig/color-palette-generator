import { EyedropperSampleIcon } from '@phosphor-icons/react/dist/csr/EyedropperSample'
import { PlayIcon } from '@phosphor-icons/react/dist/csr/Play'
import Color from 'colorjs.io'
import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { ColorSpaceAndFormat } from '../../types'
import Button from '../button/Button'
import { ColorContext } from '../ColorContext'
import { LinearGradientSVG } from '../LinearGradientSVG'
import { MessageContext } from '../MessageContext'
import './input-color-container.css'

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
  const baseColor = context.originalColor
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
      try {
        new Color(input)
        setColor(input)
        showMessage(`Color set`, 'success')
      } catch (e) {
        showMessage('Invalid format', 'error')
      }
    }
  }

  useEffect(() => {
    setInput(baseColor?.conversions[colorSpace.format].value)
  }, [colorSpace, context])

  return (
    <div className="input-color-container">
      {window.EyeDropper ? (
        <Button handler={handleEyedropper} active={active} className="eyedropper-button inverse">
          <EyedropperSampleIcon size={20} color="url(#eyedropper-gradient)" weight="fill">
            <LinearGradientSVG id="eyedropper-gradient" />
          </EyedropperSampleIcon>
        </Button>
      ) : null}

      <label htmlFor="input-color-container-input" className="sr-only">
        Color
      </label>
      <input
        id="input-color-container-input"
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
        <PlayIcon size={20} color="url(#play-gradient)" weight="fill">
          <LinearGradientSVG id="play-gradient" />
        </PlayIcon>
      </Button>
    </div>
  )
}
