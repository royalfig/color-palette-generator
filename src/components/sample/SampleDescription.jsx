export default function SampleDescription({ palette }) {
  switch (palette) {
    case "complement":
      return (
        <>
          <p>To make a thing outta sight.</p>
          <p>
            Complementary palettes are constituted by the primary color and its
            complement, which is on the opposite side of the color wheel
            (180&deg;).
          </p>
        </>
      );
    case "adjacent":
      return (
        <p>
          Adjacent palettes consist of the primary color and two additional
          colors, each shifted 30&deg;.
        </p>
      );

    case "triad":
      return (
        <p>
          Triadic palettes consist of the primary color and two additional
          colors, each shifted 120&deg;
        </p>
      );

    case "tetrad":
      return (
        <p>
          Triadic palettes consist of the primary color and three additional
          colors, each shifted 90&deg;
        </p>
      );

    case "tints":
      return (
        <p>
          Shades and tints include 10 variations of the base color, mixed with
          black or white.
        </p>
      );

    case "mono":
      return (
        <>
          <p>It's bougie. It's monochromatic.</p>
          <p>10 desaturated versions of the color in varying lightnesses.</p>
        </>
      );

    case "split":
      return (
        <p>
          Split complementary palettes begin from the primary color. They then
          derive two additional colors that are 30&deg; away from the
          complementary color.
        </p>
      );
  }
}
