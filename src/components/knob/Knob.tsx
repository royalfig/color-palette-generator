import { BombIcon } from '@phosphor-icons/react'
import { container, display, inner, knob } from './knob.module.css'

export function Knob() {
  return (
    <div className={container}>
      <div className={knob}>
        <div className={inner}></div>
      </div>
      <div className={display}>
        <BombIcon weight="fill" size={18} />
        <p>100</p>
      </div>
    </div>
  )
}
