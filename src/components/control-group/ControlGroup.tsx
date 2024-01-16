import "./control-group.css";

export function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="control-group">
      <h2 className="control-group-title">{title}</h2>
      <div className="control-group-container">
        {children}
      </div>
    </div>
  )
}