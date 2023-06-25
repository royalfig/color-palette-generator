import "../../css/Sample.css";

import Analogous from "./analogous/Analogous";
import Complementary from "./complementary/Complementary";
import Shades from "./shades/Shades";
import Split from "./split/Split";
import Tetradic from "./tetradic/Tetradic";
import Tones from "./tones/Tones";
import Triad from "./triad/Triad";

export default function Sample({ selectedPalette }) {
  const name = selectedPalette.name;
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
    case "tintsandshades":
      return Shades;
    case "triadic":
      return Triad;
    case "analogous":
      return Analogous;
    case "tetradic":
      return Tetradic;
    case "tones":
      return Tones;
    case "polychroma":
      return Tones;
    case "ombre":
      return Tones;
  }
}
