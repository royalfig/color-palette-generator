# @royalfig/color-palette-pro

## 3.2.1

### Patch Changes

- f23643f: bg lightness for circle

## 3.2.0

### Minor Changes

- 0ec5252: Updated hues for ansi

## 3.1.1

### Patch Changes

- 86ef11d: Naming convention change

## 3.1.0

### Minor Changes

- a8c9e35: code-mode: theme-quality pass. Generated editor/terminal themes now read closer to hand-crafted ones:

  - **Terminal ANSI ramps** are no longer flat. Each slot carries a hue-natural chroma profile (red/green/magenta punchier, yellow/cyan softer), the per-lens chroma/lightness spread is widened, and slot hues drift further toward the seed palette — so a terminal theme has real per-color texture and the seed actually colors it.
  - **Hero token.** One loud role (the keyword) is guaranteed a clear chromatic step above the rest of the syntax field, so the eye has a lead instead of a flat band of equal-saturation tokens.
  - **Convention-aware role assignment.** Loud swatches are permuted (hue set preserved — no hue is invented or rotated) so strings land green/warm and keywords land on a loud cool/hot hue, only when the geometry would otherwise place a convention-violating color. Decisions are hue-only and tie-stable, so a token's hue stays identical across all four styles (style remains material-only).
  - Accent-color selection (`selectAccentColors`) reworked to draw secondary/tertiary directly from palette swatches per kind.

### Patch Changes

- 5c81e6e: - Updating code mode naming scheme

## 2.6.1

### Patch Changes

- 4502a6d: Fix chroma editing and make palette gamut clamping display-aware.

  - `colorFactory` no longer reduces the stored color's chroma to the sRGB gamut up front. That clamp made the OKLCH chroma slider snap back to the sRGB boundary; output stays gamut-safe because every serialized form (hex/rgb/hsl/fallback) gamut-maps hue-stably on its own.
  - Palette generators now clamp generated swatches to the _selected display gamut_ (`gamutForSpace`): sRGB/HSL stay sRGB, while P3/OKLCH/OKLab/LCH/Lab target P3 — so wide-gamut modes produce vibrant, P3-realizable swatches instead of muting to sRGB.

## 2.6.0

### Minor Changes

- 426d775: Invert style/kind and make code-mode inherit the UI surfaces.

  - **STYLE is now a shared surface-material dial** (square neutral → triangle tinted → circle toned → diamond brutalist), implemented once in `ui.ts` `SURFACE_TREATMENT` and consumed by both the UI palette and code-mode. `generateUiColorPalette` takes a `paletteStyle` argument and `generateCssVariables` takes a `style` option (selects the elevation shadow profile — diamond is hard-edged).
  - **KIND carries the per-exemplar color model** — token bands + accent placement re-keyed from each exemplar's measured OKLCH band: ana→Nord, com→Night Owl, spl→Dracula, tri→One Dark Pro, tet→Dark Modern, tas/ton→monochrome.
  - **Aurora functional tier**: code-mode error/warning/success adopt the kind's saturation and lean toward the base hue for analogous/monochrome kinds; tints-and-shades is now true monochrome.
  - **Code-mode chrome is a passthrough of the UI surfaces** — editor background, sidebar, overlay, inputs, foreground, outline, and status bar are derived directly from the style-aware UI surface tokens, replacing the bespoke per-lens editor-depth + chrome-chroma system.

## 2.4.0

### Minor Changes

- 3f19b9e: Updated color logic

## 2.2.0

### Minor Changes

- 0c0dc96: Updated UI generation logic

## 2.1.0

### Minor Changes

- d01bd9d: Updated UI generation logic

## 2.0.0

### Major Changes

- 9437d5c: Initial extracted release of the color palette orchestration logic! 🎨
  Includes the core geometry generators (analogous, triadic, etc.) and deep OKLCH mathematical compensations.
