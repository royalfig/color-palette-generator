import { useCallback, useEffect, useState } from "react";

import { debounce } from "lodash-es";

export function ColorName({ hex }) {
  const [colorName, setColorName] = useState(hex);

  useEffect(() => {
    const getColorName = setTimeout(async () => {
      console.log("fetching: ", hex);
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
