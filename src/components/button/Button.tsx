import './button.css'

export default function Button({
  handler,
  active,
  children,
  className,
}: {
  handler: () => void
  active: boolean
  children: React.ReactNode
  className?: string
}) {
  const activeClass = active ? 'button active' : 'button'

  const buttonClass = `button-container ${className || ''}`

  return (
    <div className={buttonClass}>
      <button className={activeClass} onClick={handler}>
        {children}
      </button>
    </div>
  )
}
