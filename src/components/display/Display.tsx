import './display.css'

export function Display( { spacing, children }: { spacing: string, children: React.ReactNode }) {
  const spacingVar = {'--inner-spacing': `var(--spacing-${spacing})`} as React.CSSProperties
  return (
    <div className="display relative" style={spacingVar}>
      <div className="display-inner">{children}</div>
    </div>
  )
}
