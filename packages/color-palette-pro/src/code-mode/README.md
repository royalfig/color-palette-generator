# code-mode

Generates editor/terminal color themes from a seed color + generated palette. One seed produces a coherent theme across
six output formats (VS Code, Zed, Ghostty, iTerm2, Warp, Alacritty) and every `kind × style × mode` permutation.

## Inputs

Every entry point takes the same five inputs:

| Input          | Type              | Meaning                                                             |
| -------------- | ----------------- | ------------------------------------------------------------------- |
| `baseColor`    | `Color`           | The seed color.                                                     |
| `palette`      | `BaseColorData[]` | The generated palette for `(kind, style)` (from `createPalettes`).  |
| `isDarkMode`   | `boolean`         | Dark or light variant.                                              |
| `paletteKind`  | `PaletteKinds`    | `ana \| com \| spl \| tet \| tri \| tas` — the _color model_.       |
| `paletteStyle` | `PaletteStyle`    | `square \| triangle \| circle \| diamond` — the _surface material_. |

### KIND vs STYLE

This is the core mental model (the "style/kind inversion"):

- **KIND = the color model (geometry).** Each kind is a palette scheme — `ana` analogous, `com` complementary, `spl`
  split-comp, `tri` triadic, `tet` tetradic, `tas` monochrome — and its `templates/*.ts` maps that geometry's swatches
  onto the syntax roles. The generated palette's hues flow into the theme intact (**palette-primary**): an analogous
  palette yields an analogous theme, a tetradic palette a four-family one. The kind no longer imitates a specific
  exemplar theme (the old per-kind Nord/Dracula token-band envelopes were retired).
- **STYLE = the surface material dial.** square (flat/neutral) → diamond (brutalist/toned). Implemented once in
  `../ui.ts` (`SURFACE_TREATMENT`) and inherited here as a passthrough — the editor chrome _is_ the UI surface stack.
  Style also modulates ANSI intensity and lightness spread (material only — never hue: the palette's hues are identical
  across all four styles).

Intensity (how saturated the palette runs) is **seed-driven**: it comes from the base color's chroma, not the kind. See
`intensity.ts`.

## Module map

| File             | Responsibility                                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `index.ts`       | `buildThemeData` orchestrator + the public API (`generateTheme`, `generateCodeTheme`, pairs, serialize).                                                                                                                       |
| `personality.ts` | Per-style font/lens; character "feel" knobs (peak-alpha, cursor, inactive selection, neutral-band tint). Character is _derived from the palette_ (mean chroma → serene/crisp/vivid, single-hue → mono), not assigned per kind. |
| `constants.ts`   | Role lists, APCA targets, chroma tiers, the generic `READABILITY_BAND`, and the ANSI tables (slots, drift factor, follow, L-spread, intensity band). Data only.                                                                |
| `intensity.ts`   | `intensityChromaFor(seedChroma, style)` — the seed→chroma-band remap.                                                                                                                                                          |
| `syntax.ts`      | The syntax-color pipeline + `buildSyntax()` orchestrator.                                                                                                                                                                      |
| `ansi.ts`        | `deriveAnsiPalette()` — the 16-color terminal palette.                                                                                                                                                                         |
| `overlay.ts`     | `legibleOverlayAlpha()` — smallest legible alpha for a translucent selection overlay.                                                                                                                                          |
| `names.ts`       | Theme slugs/display names + the prose description.                                                                                                                                                                             |
| `utils.ts`       | Generic color helpers (OKLCH math, APCA/contrast, gamut, hue gap, bright-ANSI).                                                                                                                                                |
| `types.ts`       | All shared types (`SemanticColors`, `SyntaxColors`, `ThemeData`, personality types, `ThemeFormat`).                                                                                                                            |
| `templates/`     | Per-kind `deriveColors` + `deriveBracketPairs` (raw syntax colors before the pipeline). `base.ts` is the VS Code serializer (token rules + UI colors).                                                                         |
| `formats/`       | One serializer per output format: `zed`, `iterm2`, `ghostty`, `warp`, `alacritty`.                                                                                                                                             |

## Generation flow (`buildThemeData`)

```
inputs ─► personality (kind bands + style/character knobs)
       ─► primary = adaptPrimaryForMode(palette[0])
       ─► intensityChroma = intensityChromaFor(seed chroma, style)        [intensity.ts]
       ─► surfaces = generateSurfaceColors(primary, style treatment)      [../ui.ts]  ── passthrough
       ─► semantics (error/warning/success/info) @ intensity chroma       [../ui.ts]
       ─► containers + secondary + info colors                            [../ui.ts]
       ─► rawSyntax = template.deriveColors(...)                          [templates/]
       ─► syntax    = buildSyntax(rawSyntax, ctx)                         [syntax.ts]
       ─► ansi      = deriveAnsiPalette(...)                              [ansi.ts]
       ─► assemble SemanticColors  (every role → hex)
       ─► peakAlpha = legibleOverlayAlpha(focus over bg vs fg)            [overlay.ts]
       ─► ThemeData  → serializers
```

### Syntax pipeline (`buildSyntax`, `syntax.ts`)

Palette-primary: a template (`templates/*.ts`) maps the generated palette's swatches onto roles by geometry. The
pipeline preserves the palette's hue _set_ (it never invents or rotates a hue to an exemplar), but it **does**
re-permute which swatch lands on which role to honour the two load-bearing conventions, then makes everything legible,
distinct, and led by one peak:

0. **conventionalize roles** — permute the loud colours so the string is green/warm and the keyword is a loud cool/hot
   hue (a blue/violet string or a muted-gold keyword reads as amateur even when the colours are individually fine). Only
   swaps when the template's choice is actually violating, so palettes that already land right are untouched; skipped
   for mono. The hue set is preserved — this redistributes the palette's own hues, it doesn't rewrite them.
1. **readability normalize** — pull each role's L into a generic, mode-only band and clamp chroma; hue and relative
   chroma are kept (no per-kind exemplar envelope).
2. **comment hue** — keep comments ≥ 60° from strings (skipped for mono).
3. **contrast floor** — APCA-lift every role against the real editor bg (loud Lc 60, quiet 45, comments held in a
   recessed band).
4. **distinction** — separate too-close roles by **lightness/chroma, never hue**, so an analogous palette stays
   analogous and a polychrome palette keeps its swatch hues. Runs _after_ the contrast floor (lifts compress L and would
   re-collide pairs).
5. **hero peak** — raise the keyword's chroma a clear step above the rest of the loud field (capped at the band ceiling
   / sRGB gamut) so one token leads the eye instead of a flat mid-chroma field. Runs last so the final field is the
   reference; chroma-only, so contrast and distinction hold.
6. **mono pin** — for the single-hue kind (`tas`), snap every role back to the base hue.

Red (≈345–25°) is reserved for tags/keywords: a saturated-red string/function/number is shifted to orange — a legibility
guard since a red string reads as an error.

### ANSI palette (`deriveAnsiPalette`, `ansi.ts`)

The six chromatic slots resample the seed palette at canonical hues, with **hue / chroma / lightness** each taking a cue
from the nearest palette swatch:

- **hue** — canonical, drifting toward the nearest palette member, bounded by the slot's cap × a global drift factor
  (style-independent — hue is not a style axis; red stays warm for `git diff`; blue may become purple on a purple
  palette — the Dracula effect). A ring pass guarantees ≥22° between neighbors.
- **chroma** — the seed-driven `intensityChroma` centre pulled toward the swatch's own chroma
  (`ANSI_CHROMA_FOLLOW_BY_LENS`), then shaped by the slot's hue-natural multiplier (`cScale`: red/green/magenta
  punchier, yellow/cyan softer) so the ramp has the intrinsic saturation profile of the loved themes instead of a flat
  one-chroma rainbow.
- **lightness** — a mode band + hue-natural tilt + a nudge toward the swatch's lightness.

Black is a lifted near-black; white = the editor foreground; bright variants come from `brightAnsiHex` (chromatic) and
`brightWhiteHex` (white lifts toward pure white).

### Surfaces & selection

Editor chrome is a **passthrough** of the UI surface stack (`../ui.ts`): editor bg = `surface`, sidebar/panel =
`containerSunken`, overlays/inputs = `containerOverlay`/`Sunken`, foreground = `onSurface`. Kind identity lives in the
syntax bands and the surface hue, not a bespoke editor tint.

Selection differs by format family:

- **Editors (VS Code, Zed)** use a _translucent_ `focusBorder` overlay at `peakAlpha` — each glyph keeps its syntax
  color over it.
- **Terminals (Ghostty, iTerm2, Alacritty)** paint one foreground over the whole selection, so they reuse the
  contrast-checked `primaryContainer` / `onPrimaryContainer` pair instead.

## Output formats & public API

`ThemeFormat = 'vscode' | 'zed' | 'iterm2' | 'ghostty' | 'warp' | 'alacritty'`.

Public surface (re-exported from the package root):

- `generateTheme(base, palette, isDark, kind, style, format)` → serialized string (any format).
- `generateThemePair(base, palette, kind, style, format)` → `{ dark, light }`.
- `generateCodeTheme` / `generateCodeThemePair` → the VS Code `CodeThemeOutput` object.
- `serializeTheme` / `serializeThemePair` → JSON-stringify a `CodeThemeOutput`.

## Verification

- `scripts/color-gen.ts '#hex' [out.html]` — the visual catalog: every kind × style, palettes + UI tokens + a code-mode
  preview, light and dark, for one seed. Open the HTML and eyeball.

The palette-primary redesign **intentionally changes output** — the old "diff a full set, expect byte-identical" rule
does not apply to it. Validate instead by goal: a fixed seed+kind has identical hues across all four styles (style is
material-only); syntax-token hues track the palette's swatches (analogous → tight spread, tetradic → four families);
every loud token clears its APCA floor and stays ≥ ~6 ΔE from its neighbors.
