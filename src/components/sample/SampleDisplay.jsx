import Mono from "./Mono";
import Comp from "./Comp";

export default function SampleDisplay({ selectedPalette }) {
  switch (selectedPalette) {
    case "Complementary":
      return <Comp />;
    case "Split Complementary":

    case "Analogous":

    case "Triadic":

    case "Tetradic":

    case "Shades":

    case "Monochromatic":
      return <Mono />;
  }
}
