export default function Footer({ palette }) {
  return (
    <footer className={palette + "-footer"}>
      <a href="https://ryanfeigenbaum.com">Created by Ryan Feigenbaum</a>
      <div>
        <a href="http://github.com/royalfig">GitHub</a>
        <a href="http://github.com/royalfig">Twitter</a>
        <a href="http://github.com/royalfig">LinkedIn</a>
      </div>
    </footer>
  );
}
