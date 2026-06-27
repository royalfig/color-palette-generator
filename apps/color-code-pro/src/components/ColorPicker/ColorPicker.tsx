import { Button } from '@/components/Button/Button'
import { useTheme } from '@/hooks/useTheme'
import { Popover } from '@base-ui/react/popover'
import { useEffect, useRef, useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import './ColorPicker.css'

export default function ColorPicker() {
  const { baseColor, setBaseColor } = useTheme()
  const hexInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (hexInputRef.current && document.activeElement !== hexInputRef.current) {
      hexInputRef.current.value = baseColor
    }
  }, [baseColor])

  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      const normalized = val.startsWith('#') ? val : `#${val}`
      if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
        setBaseColor(normalized)
      }
    },
    [setBaseColor],
  )

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button aria-label="Pick base color">
            <span className="cc-color-swatch" style={{ backgroundColor: baseColor }}></span>
            <span className="cc-title">{baseColor}</span>
          </Button>
        }
      ></Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="cc-popup">
            <div className="cc-popover-content">
              <HexColorPicker color={baseColor} onChange={setBaseColor} />
              <input
                ref={hexInputRef}
                className="cc-color-input"
                type="text"
                defaultValue={baseColor}
                onChange={handleHexInput}
                spellCheck={false}
                maxLength={7}
                aria-label="Hex color value"
              />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
