---
"@royalfig/color-palette-pro": minor
---

code-mode: theme-quality pass. Generated editor/terminal themes now read closer to hand-crafted ones:

- **Terminal ANSI ramps** are no longer flat. Each slot carries a hue-natural chroma profile (red/green/magenta punchier, yellow/cyan softer), the per-lens chroma/lightness spread is widened, and slot hues drift further toward the seed palette — so a terminal theme has real per-color texture and the seed actually colors it.
- **Hero token.** One loud role (the keyword) is guaranteed a clear chromatic step above the rest of the syntax field, so the eye has a lead instead of a flat band of equal-saturation tokens.
- **Convention-aware role assignment.** Loud swatches are permuted (hue set preserved — no hue is invented or rotated) so strings land green/warm and keywords land on a loud cool/hot hue, only when the geometry would otherwise place a convention-violating color. Decisions are hue-only and tie-stable, so a token's hue stays identical across all four styles (style remains material-only).
- Accent-color selection (`selectAccentColors`) reworked to draw secondary/tertiary directly from palette swatches per kind.
