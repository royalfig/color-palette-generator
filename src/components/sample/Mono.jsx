export default function Mono(props) {
  return (
    <div className="mono-container">
      <div className="mono-navbar">
        <div className="brand">Monochromatic</div>
        <nav>
          <ul>
            <li>
              <button>About</button>
              <button>Resources</button>
            </li>
          </ul>
        </nav>
      </div>
      <header className="mono-header">
        <h2>It's classy.</h2>
        <p>It's bougie. It's monochromatic.</p>
      </header>
      <section className="mono-featured"></section>
      <section className="mono-list"></section>

      <footer className="mono-footer"></footer>
    </div>
  );
}
