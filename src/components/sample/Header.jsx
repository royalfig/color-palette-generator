export default function Header({ title, subtitle, description, palette }) {
  return (
    <header className={palette + "-header"}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <p className={palette + "-description"}>{description}</p>
      <a href="" className={palette + "-cta"}>
        Show me some green
      </a>
      <p>Support this project</p>
    </header>
  );
}
