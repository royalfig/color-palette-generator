import './circle.css'

function sizer(num: number, size: string) {
  if (size === 'large') {
    return num
  }

  return num / 2
}

export function Circle({ colors, type, size }: { colors: any; type: 'default' | 'circle'; size: string }) {
  const className = size === 'large' ? 'large circle' : 'small circle'

  return (
    <div className={className}>
      <svg viewBox={size === 'large' ? '-120 -120 240 240' : '-60 -60 120 120'}>
        <circle cx="0" cy="0" r={sizer(100, size)} fill="none" stroke="var(--border)" strokeWidth="3" />
        {type !== 'circle'
          ? colors.original.map((color: any, idx: number) => {
              let [h, s] = color.hsl.raw

              s = s > 100 ? 100 : s

              const hRadians = (h * Math.PI) / 180
              const sRadians = sizer(s, size)

              const x = sRadians * Math.sin(hRadians)
              const y = sRadians * Math.cos(hRadians)

              const xr = isNaN(x) ? 0 : x
              const yr = isNaN(y) ? 0 : y * -1
              return <circle key={idx} cx={xr} cy={yr} r={size === 'large' ? 18 : 12} fill={color.hex.string}></circle>
            })
          : colors.original.map((color: any, idx: number) => {
              const h = sizer((idx + 10) * (size === 'large' ? 36 : 72), size)

              const hRadians = (h * Math.PI) / 180
              const sRadians = sizer(50, size)

              const x = sRadians * Math.sin(hRadians)
              const y = sRadians * Math.cos(hRadians)

              const xr = isNaN(x) ? 0 : x
              const yr = isNaN(y) ? 0 : y * -1
              return <circle key={idx} cx={xr} cy={yr} r={size === 'large' ? 18 : 12} fill={color.hex.string}></circle>
            })}
      </svg>
    </div>
  )
}
