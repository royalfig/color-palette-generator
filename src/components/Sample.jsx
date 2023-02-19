import "../css/Sample.css";

import Analogous from "./Analogous";
import Complementary from "./Complementary";
import Shades from "./Shades";
import Split from "./Split";
import Tetradic from "./Tetradic";
import Tones from "./Tones";
import Triad from "./Triad";

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
  console.log(slug);
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
    case "tetradic":
      return Tetradic;
    case "monochromatic":
      return Tones;

    default:
      return "shades";
  }
}
