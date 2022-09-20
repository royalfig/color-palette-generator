import { useEffect, useState } from "react";
import colorNames from "../util/colorNames.json";
export function ColorName({ hex }) {
  const [colorName, setColorName] = useState(hex);
  if (hex.length === 4) {
    const [pound, a, b, c] = hex;
    const newHex = pound + a + a + b + b + c + c;

    // console.log(newHex);
  } else {
    // console.log(hex);
  }
  //   useEffect(() => {
  //     const getColorName = setTimeout(async () => {
  //       console.log("fetching: ", hex);
  //       const res = await fetch(
  //         `https://www.thecolorapi.com/id?hex=${hex.substring(1)}`
  //       );
  //       const data = await res.json();
  //       setColorName(data.name.value);
  //     }, 500);

  //     return () => clearTimeout(getColorName);
  //   }, [hex]);

  return <p>{hex}</p>;
}
