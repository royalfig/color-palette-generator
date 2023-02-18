import "../css/Sample.css";

import Complementary from "./Complementary";
import Split from "./Split";
import Shades from "./Shades";
import Triad from "./Triad";
import Analogous from "./Analogous";

export default function Sample({ selectedPalette }) {
  const name = selectedPalette[0].name;
  const slugifiedName = slugify(name);

  const SelectedComponent = selectComponent(slugifiedName);
  return (
    <section className={`sample-container ${slugifiedName}`}>
      <SelectedComponent />
    </section>
  );
}

export function slugify(name) {
  return name.replace(/\W/g, "").toLowerCase();
}

function selectComponent(slug) {
  switch (slug) {
    case "complementary":
      return Complementary;
    case "splitcomplementary":
      return Split;
    case "shades":
      return Shades;
    case "triadic":
      return Triad;
    case "analogous":
      return Analogous;
    default:
      return "shades";
  }
}
