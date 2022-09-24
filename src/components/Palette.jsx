export default function Palette({ palette, name, children }) {
  return (
    <div className="palette">
      <header>
        <h2>
          {name}{" "}
          {palette.palette ? (
            <span className="badge">{palette.palette}</span>
          ) : (
            ""
          )}
        </h2>
      </header>
      {children}
    </div>
  );
}
