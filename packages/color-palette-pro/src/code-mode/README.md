# code-mode

Generates editor/terminal color themes from a seed color + generated palette. One seed
produces a coherent theme across six output formats (VS Code, Zed, Ghostty, iTerm2, Warp,
Alacritty) and every `kind × style × mode` permutation.

## Inputs

Every entry point takes the same five inputs:

| Input | Type | Meaning |
|---|---|---|
| `baseColor` | `Color` | The seed color. |
| `palette` | `BaseColorData[]` | The generated palette for `(kind, style)` (from `createPalettes`). |
| `isDarkMode` | `boolean` | Dark or light variant. |
| `paletteKind` | `PaletteKinds` | `ana \| com \| spl \| tet \| tri \| tas \| ton` — the *color model*. |
| `paletteStyle` | `PaletteStyle` | `square \| triangle \| circle \| diamond` — the *surface material*. |

### KIND vs STYLE

This is the core mental model (the "style/kind inversion"):

- **KIND = the exemplar color model.** Each kind maps to a hand-tuned reference theme and owns
  the syntax *token bands* and *accent placement*: `ana`→Nord, `com`→Night Owl, `spl`→Dracula,
  `tri`→One Dark Pro, `tet`→Dark Modern, `tas`/`ton`→monochrome. Lives in `personality.ts`.
- **STYLE = the surface material dial.** square (flat/neutral) → diamond (brutalist/toned).
  Implemented once in `../ui.ts` (`SURFACE_TREATMENT`) and inherited here as a passthrough — the
  editor chrome *is* the UI surface stack. Style also modulates ANSI hue-drift and intensity.

Intensity (how saturated the palette runs) is **seed-driven**: it comes from the base color's
chroma, not the kind. See `intensity.ts`.

## Module map

| File | Responsibility |
|---|---|
| `index.ts` | `buildThemeData` orchestrator + the public API (`generateTheme`, `generateCodeTheme`, pairs, serialize). |
| `personality.ts` | Per-kind token bands + accent roles; per-style font/lens; character "feel" knobs (peak-alpha, cursor, inactive selection, neutral-band tint). |
| `constants.ts` | Role lists, APCA contrast targets, chroma tiers, and the ANSI tables (slots, drift, follow, L-spread, intensity band). Data only. |
| `intensity.ts` | `intensityChromaFor(seedChroma, style)` — the seed→chroma-band remap. |
| `syntax.ts` | The syntax-color pipeline + `buildSyntax()` orchestrator. |
| `ansi.ts` | `deriveAnsiPalette()` — the 16-color terminal palette. |
| `overlay.ts` | `legibleOverlayAlpha()` — smallest legible alpha for a translucent selection overlay. |
| `names.ts` | Theme slugs/display names + the prose description. |
| `utils.ts` | Generic color helpers (OKLCH math, APCA/contrast, gamut, hue gap, bright-ANSI). |
| `types.ts` | All shared types (`SemanticColors`, `SyntaxColors`, `ThemeData`, personality types, `ThemeFormat`). |
| `templates/` | Per-kind `deriveColors` + `deriveBracketPairs` (raw syntax colors before the pipeline). `base.ts` is the VS Code serializer (token rules + UI colors). |
| `formats/` | One serializer per output format: `zed`, `iterm2`, `ghostty`, `warp`, `alacritty`. |

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

Raw template colors are pushed through a fixed, load-bearing order:

1. **hue conventions** — permute loud colors so green=string, purple=keyword, … (people read
   the convention before the geometry).
2. **band normalize** — remap loud L/C into the kind's measured envelope; the accent role(s)
   get the chroma peak, everything else compresses below it.
3. **comment hue** — keep comments ≥ 60° from strings (skipped for mono).
4. **contrast floor** — APCA-lift every role against the real editor bg (loud Lc 60, quiet 45,
   comments held in a recessed band).
5. **distinction** — separate too-close roles. Polychrome rotates hue; mono steps lightness.
   Runs *after* the contrast floor (lifts compress L and would re-collide pairs). Pressure is
   character-aware so muted kinds stay muted.
6. **identifier family** — link variables/properties to the cool loud family.
7. **mono pin** — for mono kinds, snap every role back to the base hue.

Red (≈345–25°) is reserved for tags/keywords; strings/functions/numbers avoid it at every stage.

### ANSI palette (`deriveAnsiPalette`, `ansi.ts`)

The six chromatic slots resample the seed palette at canonical hues, with **hue / chroma /
lightness** each taking a cue from the nearest palette swatch:

- **hue** — canonical, drifting toward the nearest palette member, bounded by the slot's cap ×
  style factor (red stays warm for `git diff`; blue may become purple on a purple palette — the
  Dracula effect). A ring pass guarantees ≥22° between neighbors.
- **chroma** — the seed-driven `intensityChroma` centre pulled toward the swatch's own chroma.
- **lightness** — a mode band + hue-natural tilt + a nudge toward the swatch's lightness.

Black is a lifted near-black; white = the editor foreground; bright variants come from
`brightAnsiHex` (chromatic) and `brightWhiteHex` (white lifts toward pure white).

### Surfaces & selection

Editor chrome is a **passthrough** of the UI surface stack (`../ui.ts`): editor bg = `surface`,
sidebar/panel = `containerSunken`, overlays/inputs = `containerOverlay`/`Sunken`, foreground =
`onSurface`. Kind identity lives in the syntax bands and the surface hue, not a bespoke editor
tint.

Selection differs by format family:
- **Editors (VS Code, Zed)** use a *translucent* `focusBorder` overlay at `peakAlpha` — each
  glyph keeps its syntax color over it.
- **Terminals (Ghostty, iTerm2, Alacritty)** paint one foreground over the whole selection, so
  they reuse the contrast-checked `primaryContainer` / `onPrimaryContainer` pair instead.

## Output formats & public API

`ThemeFormat = 'vscode' | 'zed' | 'iterm2' | 'ghostty' | 'warp' | 'alacritty'`.

Public surface (re-exported from the package root):

- `generateTheme(base, palette, isDark, kind, style, format)` → serialized string (any format).
- `generateThemePair(base, palette, kind, style, format)` → `{ dark, light }`.
- `generateCodeTheme` / `generateCodeThemePair` → the VS Code `CodeThemeOutput` object.
- `serializeTheme` / `serializeThemePair` → JSON-stringify a `CodeThemeOutput`.

## Verification scripts

- `scripts/selection-contrast.mts` — WCAG selection-fg/bg contrast + palette 7≠15 across seeds.
- `scripts/intensity-check.mts` — ANSI chroma rises with seed chroma + shape; chroma floor holds.
- `scripts/theme-metrics.mts` — OKLCH "shape" of generated vs exemplar themes.
- `generate-all-themes.mts` (VS Code) / `generate-editor-themes.mts` (zed/ghostty/warp/alacritty)
  — write every permutation to `generated-themes/` for eyeballing.

When changing pipeline logic, generate a full set before and after and diff — most refactors
should be **byte-identical**.
