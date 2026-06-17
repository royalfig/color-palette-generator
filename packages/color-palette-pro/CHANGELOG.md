# @royalfig/color-palette-pro

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
