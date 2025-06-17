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

  return (
    <div className={`button-container ${className}`}>
      <div className="button-container-inner">
        <button className={activeClass} onClick={handler}>
          {children}
        </button>
      </div>
    </div>
  )
}
