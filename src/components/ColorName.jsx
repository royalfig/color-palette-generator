import { useEffect, useState } from "react";
import colorNames from "../util/colorNames.json";
export function ColorName({ hex }) {
  const [colorName, setColorName] = useState(hex);

  useEffect(() => {
    const getColorName = setTimeout(async () => {
      const res = await fetch(
        `https://www.thecolorapi.com/id?hex=${hex.substring(1)}`
      );
      const data = await res.json();
      setColorName(data.name.value);
    }, 500);

    return () => clearTimeout(getColorName);
  }, [hex]);

  return <p>{colorName}</p>;
}

// console.log("fetching");
// const colorCodes = colors.map(({ color, corrected }) => [
//   hex3to6(color),
//   hex3to6(corrected),
// ]);

// const res = await fetch(
//   `https://api.color.pizza/v1/${colorCodes.flat().join()}`
// );
// const names = await res.json();

// const colorsWithNames = colors.map(({ color, corrected }) => {
//   const hex = "#" + hex3to6(color.toString({ format: "hex" }));
//   const correctedHex = "#" + hex3to6(corrected.toString({ format: "hex" }));
//   const colorName = names.colors.find((color) => {
//     return color.requestedHex === hex;
//   });
//   const correctedName = names.colors.find((color) => {
//     return color.requestedHex === correctedHex;
//   });
// });

// return {
//   palette: names.paletteTitle,
//   colors: colorsWithNames,
// };

// console.log(f);

// return colors.map(({ color, corrected }) => {
//   return {
//     hex: color.toString({ format: "hex" }),
//     rgb: color.to("srgb").toString({ precision: 3 }),
//     hsl: color.to("hsl").toString({ precision: 3 }),
//     black: color.contrast("black", "wcag21"),
//     white: color.contrast("white", "wcag21"),
//     corrected: {
//       hex: corrected.toString({ format: "hex" }),
//       rgb: corrected.to("srgb").toString({ precision: 3 }),
//       hsl: corrected.to("hsl").toString({ precision: 3 }),
//       black: color.contrast("black", "wcag21"),
//       white: color.contrast("white", "wcag21"),
//     },
//   };
// });
