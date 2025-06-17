import { useState } from 'react'
import Button from '../button/Button'
import './eye-dropper.css'
import { EyedropperSampleIcon } from '@phosphor-icons/react/dist/csr/EyedropperSample'
// Eyedropper isn't included yet on the window object
declare global {
  interface Window {
    EyeDropper: any
  }
}
export function EyeDropper({ setColor, setColorSpace }: { setColor: Function; setColorSpace: Function }) {
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

  return (
    <>
      {window.EyeDropper ? (
        <Button handler={handleEyedropper} active={active} className="eyedropper-button">
          <EyedropperSampleIcon size={22} color="var(--icon-element)" weight="fill" />
        </Button>
      ) : null}
    </>
  )
}
