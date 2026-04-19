import './input-group.css'

export function InputGroup({ children }: { children: React.ReactNode }) {
  return (
    <form className="input-group">
      <fieldset className="flex gap-02">
        <legend>Inputs</legend>
        {children}
      </fieldset>
    </form>
  )
}
