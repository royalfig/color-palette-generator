export function LinearGradientSVG({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--icon-gradient-top)" />
        <stop offset="50%" stopColor="var(--icon-gradient-center)" />
        <stop offset="100%" stopColor="var(--icon-gradient-top)" />
      </linearGradient>
    </defs>
  )
}
