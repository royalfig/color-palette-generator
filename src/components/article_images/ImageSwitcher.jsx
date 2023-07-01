import Sun from "./Sun";
import Boredom from "./Boredom";
import Liar from "./Liar";

export default function ImageSwitcher({ type }) {
  switch (type) {
    case "sun":
      return <Sun />;
    case "boredom":
      return <Boredom />;
    case "liar":
      return <Liar />;
  }
}
