import './display.css'

export function Display({ children }: { children: React.ReactNode }) {
  return (
    <section className="synth-display">
      <div className="display">
        <div className="display-inner">{children}</div>
      </div>
    </section>
  )
}
