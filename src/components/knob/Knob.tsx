import { WaveSawtoothIcon } from '@phosphor-icons/react/dist/csr/WaveSawtooth'
import { WaveSineIcon } from '@phosphor-icons/react/dist/csr/WaveSine'
import { WaveTriangleIcon } from '@phosphor-icons/react/dist/csr/WaveTriangle'
import { WaveSquareIcon } from '@phosphor-icons/react/dist/csr/WaveSquare'
import './knob.css'

const knobs = [
  {
    icon: WaveSawtoothIcon,
    value: '000',
  },
  {
    icon: WaveSineIcon,
    value: '099',
  },
  {
    icon: WaveTriangleIcon,
    value: '022',
  },
  {
    icon: WaveSquareIcon,
    value: '100',
  },
]

export function Knob() {
  return (
    <div className="knobs">
      {knobs.map((knob, idx) => (
        <div className="knob-container" key={idx}>
          <div className="knob-outer">
            <div className="knob-inner-shadow"></div>
            <div className="knob-inner">
              <div className="knob-indicator"></div>
            </div>
          </div>
          <div className="knob-display">
            <knob.icon size={18} weight="duotone" />
            <p>{knob.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
