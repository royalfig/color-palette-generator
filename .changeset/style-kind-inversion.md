---
"@royalfig/color-palette-pro": minor
---

Invert style/kind and make code-mode inherit the UI surfaces.

- **STYLE is now a shared surface-material dial** (square neutral → triangle tinted → circle toned → diamond brutalist), implemented once in `ui.ts` `SURFACE_TREATMENT` and consumed by both the UI palette and code-mode. `generateUiColorPalette` takes a `paletteStyle` argument and `generateCssVariables` takes a `style` option (selects the elevation shadow profile — diamond is hard-edged).
- **KIND carries the per-exemplar color model** — token bands + accent placement re-keyed from each exemplar's measured OKLCH band: ana→Nord, com→Night Owl, spl→Dracula, tri→One Dark Pro, tet→Dark Modern, tas/ton→monochrome.
- **Aurora functional tier**: code-mode error/warning/success adopt the kind's saturation and lean toward the base hue for analogous/monochrome kinds; tints-and-shades is now true monochrome.
- **Code-mode chrome is a passthrough of the UI surfaces** — editor background, sidebar, overlay, inputs, foreground, outline, and status bar are derived directly from the style-aware UI surface tokens, replacing the bespoke per-lens editor-depth + chrome-chroma system.
