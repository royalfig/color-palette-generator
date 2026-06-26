import { useRef, useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { WaveSawtoothIcon } from '@phosphor-icons/react/dist/csr/WaveSawtooth'
import { WaveSineIcon } from '@phosphor-icons/react/dist/csr/WaveSine'
import { WaveTriangleIcon } from '@phosphor-icons/react/dist/csr/WaveTriangle'
import { WaveSquareIcon } from '@phosphor-icons/react/dist/csr/WaveSquare'
import { TriangleIcon } from '@phosphor-icons/react/dist/csr/Triangle'
import './knob.css'

const knobConfigs = [
  {
    icon: WaveSawtoothIcon,
    defaultValue: 0,
  },
  {
    icon: WaveSineIcon,
    defaultValue: 0,
  },
  {
    icon: WaveTriangleIcon,
    defaultValue: 0,
  },
  {
    icon: WaveSquareIcon,
    defaultValue: 0,
  },
]

// Map value (0-100) to angle (e.g., 130deg to 410deg)
function valueToAngle(value: number) {
  const minAngle = 0
  const maxAngle = 270
  return Math.round(minAngle + ((maxAngle - minAngle) * value) / 100)
}

type KnobProps = {
  initialValues: number[]
  onChange: (values: number[]) => void
}

export function Knob({ initialValues, onChange }: KnobProps) {
  const SENSITIVITY = 1 // Dragging sensitivity: higher = faster
  const WHEEL_STEP = 5 // Mouse wheel step size
  const [values, setValues] = useState(initialValues)
  const [dragging, setDragging] = useState<number | null>(null)
  const draggingIndex = useRef<number | null>(null)
  const lastY = useRef<number>(0)

  // Debounce the onChange callback
  const debouncedOnChange = useDebouncedCallback((vals: number[]) => {
    onChange(vals)
  }, 100)

  useEffect(() => {
    debouncedOnChange(values)
  }, [values, debouncedOnChange])

  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    e.preventDefault() // Prevent touch scrolling on mobile
    draggingIndex.current = idx
    lastY.current = e.clientY
    document.body.style.userSelect = 'none'
    document.body.style.touchAction = 'none' // Prevent touch scrolling during drag
    setDragging(idx)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (draggingIndex.current === null) return
    const idx = draggingIndex.current
    const deltaY = e.clientY - lastY.current
    lastY.current = e.clientY
    setValues(prev =>
      prev.map((v, i) => (i === idx ? Math.max(0, Math.min(100, Math.round(v + deltaY * SENSITIVITY))) : v)),
    )
  }

  const handlePointerUp = () => {
    draggingIndex.current = null
    document.body.style.userSelect = ''
    document.body.style.touchAction = '' // Restore touch scrolling
    setDragging(null)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }

  // Keyboard accessibility
  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setValues(prev => prev.map((v, i) => (i === idx ? Math.max(0, v - 1) : v)))
      e.preventDefault()
    } else if (e.key === 'ArrowRight') {
      setValues(prev => prev.map((v, i) => (i === idx ? Math.min(100, v + 1) : v)))
      e.preventDefault()
    }
  }

  // Mouse wheel support
  const handleWheel = (idx: number, e: React.WheelEvent) => {
    setValues(prev =>
      prev.map((v, i) => (i === idx ? Math.max(0, Math.min(100, v - Math.sign(e.deltaY) * WHEEL_STEP)) : v)),
    )
  }

  // Double-click to reset
  const handleDoubleClick = (idx: number) => {
    setValues(prev => prev.map((v, i) => (i === idx ? knobConfigs[idx].defaultValue : v)))
  }

  return (
    <div className="knobs">
      {knobConfigs.map((knob, idx) => {
        const value = values[idx]
        const angle = valueToAngle(value)
        return (
          <div className="knob-container" key={idx}>
            <div
              className={`knob-outer${dragging === idx ? ' dragging' : ''}`}
              tabIndex={0}
              aria-label="Knob control"
              onPointerDown={e => handlePointerDown(idx, e)}
              onKeyDown={e => handleKeyDown(idx, e)}
              onDoubleClick={() => handleDoubleClick(idx)}
              onWheel={e => handleWheel(idx, e)}
            >
              <div className="knob-inner-shadow"></div>
              <div className="knob-inner">
                <div
                  className="knob-indicator"
                  style={{
                    ['--angle' as any]: `${angle}deg`,
                  }}
                ></div>
              </div>
            </div>
            <div className="knob-display">
              <knob.icon size={18} weight="duotone" />
              <span>{value.toString().padStart(3, '0')}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
