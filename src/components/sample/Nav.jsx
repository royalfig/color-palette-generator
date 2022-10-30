export default function Nav({ title, palette }) {
  return (
    <div className={palette + "-navbar"}>
      <div className="brand">{title}</div>
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
  );
}
