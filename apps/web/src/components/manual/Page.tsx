export function Page({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div className="page-container">
      <header id={id}>
        <h2>{title}</h2>
        <div className="manual-divider"></div>
      </header>
      {children}
    </div>
  )
}
