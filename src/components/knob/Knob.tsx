import { BombIcon } from '@phosphor-icons/react'
import './knob.css'

export function Knob() {
  return (
    <div className="knob-container">
      <div className="knob-knob">
        <div className="knob-inner"></div>
      </div>
      <div className="knob-display">
        <BombIcon weight="fill" size={18} />
        <p>100</p>
      </div>
    </div>
  )
}
