import "../../css/Mono.css";

export default function Mono(props) {
  return (
    <div className="mono-container">
      <div className="mono-navbar">
        <div className="brand">Monochromatic</div>
        <nav>
          <ul>
            <li>
              <a>About</a>
            </li>
            <li>
              <a>Resources</a>
            </li>
          </ul>
        </nav>
      </div>
      <header className="mono-header">
        <h2>It's classy.</h2>

        <p>It's bougie. It's monochromatic.</p>

        <p className="mono-description">
          10 desaturated versions of the color in varying lightnesses.
        </p>

        <a href="" className="mono-cta">
          Show me some green
        </a>
        <p>Support this project</p>
      </header>
      <section className="mono-featured">
        <article className="mono-featured-card">
          <div class="mono-featured-image"></div>
          <h3>Relative luminance: a TL;DR</h3>
        </article>
        <article className="mono-featured-card">
          <div class="mono-featured-image"></div>
          <h3>Why HSL is a liar</h3>
        </article>
        <article className="mono-featured-card">
          <div class="mono-featured-image"></div>
          <h3>The browser is dull</h3>
        </article>
      </section>

      <section className="mono-list"></section>

      <footer className="mono-footer">
        <a href="http://github.com/royalfig">GitHub</a>
      </footer>
    </div>
  );
}
