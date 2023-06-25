import ColorUtil from "colorjs.io";

export function validateHex(color, setHex, setValidationError) {
  setHex(color);
  const withoutHash = color.replace("#", "");

  if (
    withoutHash.length < 3 ||
    (withoutHash.length > 3 && withoutHash.length < 6)
  ) {
    setHex(color);
    return;
  }

  if (withoutHash.length > 6) {
    setValidationError(
      `Can't parse color. Too many digits (${withoutHash.length})`
    );
  }

  try {
    setHex(color);
    const newHex = new ColorUtil("#" + withoutHash);
    return newHex.toString({ format: "hex" });
  } catch (error) {
    setValidationError(`Couldn't parse "${color}" as a hex color.`);
  }
}

export function validateRgb(color, setRgb, setValidationError) {
  setRgb(color);
  const rgbMatch = color.match(/\d+%?/g);

  if (rgbMatch === null) {
    setRgb(color);
    return;
  }

  if (rgbMatch.length !== 3) {
    setRgb(color);
    return;
  }

  setRgb(color);
  if (rgbMatch.length === 3) {
    try {
      const newRgb = new ColorUtil(
        `rgb(${rgbMatch[0]} ${rgbMatch[1]} ${rgbMatch[2]})`
      );
      const formattedHexColor = newRgb.toString({ format: "hex" });
      return formattedHexColor;
    } catch (e) {
      setValidationError(`Couldn't parse "${color}" as an RGB color.`);
    }
  }

  setValidationError(`Couldn't parse "${color}" as an RGB color.`);
}

export function validateHsl(color, setHsl, setValidationError) {
  const hslMatch = color.match(/\d+%?/g);

  if (hslMatch === null) {
    setHsl(color);
    return;
  }

  if (hslMatch.length !== 3) {
    setHsl(color);
    return;
  }

  setHsl(color);
  if (hslMatch.length === 3) {
    try {
      const newHsl = new ColorUtil(
        `hsl(${hslMatch[0].replace("%", "")} ${hslMatch[1].match(/\d+/)[0]}% ${
          hslMatch[2].match(/\d+/)[0]
        }%)`
      );
      const formattedHexColor = newHsl.to("srgb").toString({ format: "hex" });
      return formattedHexColor;
    } catch (e) {
      setValidationError(`Couldn't parse "${color}" as an HSL color.`);
    }
  }
}

export function validateLch(color, setLch, setValidationError) {
  const lchMatch = color.match(/\d+%?/g);

  if (lchMatch === null) {
    setLch(color);
    return;
  }

  if (lchMatch.length !== 3) {
    setLch(color);
    return;
  }

  setLch(color);
  if (lchMatch.length === 3) {
    try {
      const newLch = new ColorUtil(
        `lch(${lchMatch[0]}% ${lchMatch[1]} ${lchMatch[2]})`
      );

      const formattedHexColor = newLch.to("srgb").toString({ format: "hex" });
      return formattedHexColor;
    } catch (e) {
      setValidationError(`Couldn't parse "${color}" as an LCH color.`);
    }
  }
}

export function validateOkLch(color, setOkLch, setValidationError) {
  const oklchMatch = color.match(/\d+%?/g);

  if (oklchMatch === null) {
    setOkLch(color);
    return;
  }

  if (oklchMatch.length !== 3) {
    setOkLch(color);
    return;
  }

  setOkLch(color);
  if (oklchMatch.length === 3) {
    try {
      const newOkLch = new ColorUtil(
        `oklch(${oklchMatch[0]}% ${oklchMatch[1]} ${oklchMatch[2]})`
      );

      const formattedHexColor = newOkLch.to("srgb").toString({ format: "hex" });
      return formattedHexColor;
    } catch (e) {
      setValidationError(`Couldn't parse "${color}" as an LCH color.`);
    }
  }
}

export function validateLab(color, setLab, setValidationError) {
  const labMatch = color.match(/\d+%?/g);

  if (labMatch === null) {
    setLab(color);
    return;
  }

  if (labMatch.length !== 3) {
    setLab(color);
    return;
  }

  setLab(color);
  if (labMatch.length === 3) {
    try {
      const newLab = new ColorUtil(
        `lab(${labMatch[0]}% ${labMatch[1]} ${labMatch[2]})`
      );
      const formattedHexColor = newLab.to("srgb").toString({ format: "hex" });
      return formattedHexColor;
    } catch (e) {
      setValidationError(`Couldn't parse "${color}" as an LAB color.`);
    }
  }
}

export function validateOkLab(color, setOkLab, setValidationError) {
  const oklabMatch = color.match(/\d+%?/g);

  if (oklabMatch === null) {
    setOkLab(color);
    return;
  }

  if (oklabMatch.length !== 3) {
    setOkLab(color);
    return;
  }

  setOkLab(color);
  if (oklabMatch.length === 3) {
    try {
      const newOkLab = new ColorUtil(
        `oklab(${oklabMatch[0]}% ${oklabMatch[1]} ${oklabMatch[2]})`
      );
      const formattedHexColor = newOkLab.to("srgb").toString({ format: "hex" });
      return formattedHexColor;
    } catch (e) {
      setValidationError(`Couldn't parse "${color}" as an LAB color.`);
    }
  }
}
