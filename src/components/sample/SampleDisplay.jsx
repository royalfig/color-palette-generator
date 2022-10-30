import Mono from "./Mono";
import Comp from "./Comp";

export default function SampleDisplay({ selectedPalette }) {
  console.log(selectedPalette);
  switch (selectedPalette) {
    case "mono":
      return <Mono />;
    case "complement":
      return <Comp />;
  }
}
