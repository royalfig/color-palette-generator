import './display.css'

export function Display({ children }: { children: React.ReactNode }) {
  return <section className="synth-display col-12">{children}</section>
}
