import { ColorSpace } from 'colorjs.io/fn'

export default function RangeInput({
  label,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  colorSpace,
  fromColor,
  toColor,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
  colorSpace: string
  fromColor: string
  toColor: string
}) {
  return (
    <div
      className="range-input"
      style={{ '--color-space': colorSpace, '--from-color': fromColor, '--to-color': toColor } as React.CSSProperties}
    >
      <label htmlFor={label}>{label}</label>
      <p>{value}</p>
      <input
        id={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={label}
      />
    </div>
  )
}
