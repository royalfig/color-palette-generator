import ColorUtil from "colorjs.io";

export function validateHex(color, setValidationError) {
  const withoutHash = color.replace("#", "");

  const hexMatch = color.match(/#?([a-f0-9]{6}|[a-f0-9]{3})/i);
  // Can add early validation

  if (
    withoutHash.length < 3 ||
    (withoutHash.length > 3 && withoutHash.length < 6)
  ) {
    return;
  }

  if (withoutHash.length > 6) {
    setValidationError(
      `Can't parse color. Too many digits (${withoutHash.length})`
    );
    return;
  }

  try {
    const newHex = new ColorUtil("#" + withoutHash);
    return newHex.toString({ format: "hex" });
  } catch (error) {
    setValidationError(`Couldn't parse "${color}" as a hex color.`);
    return;
  }
}

export function validateRgb(color, setValidationError) {
  if (/-/.test(color)) {
    setValidationError(`Values can't be negative.`);
    return;
  }

  const rgbMatch = color.match(/\d+\.?\d*%?/g);

  if (rgbMatch === null) {
    return;
  }

  if (rgbMatch.length !== 3) {
    return;
  }

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

export function validateHsl(color, setValidationError) {
  const hslMatch = color.match(/\d+\.?\d*/g);

  if (hslMatch === null) {
    return;
  }

  if (hslMatch.length !== 3) {
    return;
  }

  if (hslMatch.length === 3) {
    try {
      const newHsl = new ColorUtil(
        `hsl(${hslMatch[0]} ${hslMatch[1]}% ${hslMatch[2]}%)`
      );
      const formattedHexColor = newHsl.to("srgb").toString({ format: "hex" });
      return formattedHexColor;
    } catch (e) {
      setValidationError(`Couldn't parse "${color}" as an HSL color.`);
    }
  }
}

export function validateLch(color, setValidationError) {
  const lchMatch = color.match(/\d+%?/g);

  if (lchMatch === null) {
    return;
  }

  if (lchMatch.length !== 3) {
    return;
  }

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

export function validateOkLch(color, setValidationError) {
  const oklchMatch = color.match(/\d+%?/g);

  if (oklchMatch === null) {
    return;
  }

  if (oklchMatch.length !== 3) {
    return;
  }

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

export function validateLab(color, setValidationError) {
  const labMatch = color.match(/\d+%?/g);

  if (labMatch === null) {
    return;
  }

  if (labMatch.length !== 3) {
    return;
  }

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

export function validateOkLab(color, setValidationError) {
  const oklabMatch = color.match(/\d+%?/g);

  if (oklabMatch === null) {
    return;
  }

  if (oklabMatch.length !== 3) {
    return;
  }

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
