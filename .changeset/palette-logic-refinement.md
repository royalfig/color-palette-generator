---
'@royalfig/color-palette-pro': minor
---

Palette and theme logic refinement from a six-perspective audit of the generator.

**Syntax roles** — `regexColor` and `accentColor` were absent from the distinctness set, so two of the seven loud roles were never separated from anything; 110 of 384 generated themes shipped two roles at an identical hex. Now zero, with median minimum pairwise ΔE up from 1.34 to 6.75 and median deuteranope separation up from 0.44 to 3.10. `applyHero` now works in relative chroma and buys prominence with lightness at the hue's cusp, instead of requesting an absolute chroma that blue, cyan and gold cannot hold.

**Compositing** — selection, guides, whitespace, rulers, line numbers, bracket pairs and diff backgrounds were fixed alphas tuned for light mode; several measured Lc 0.0 in every dark theme, and selecting text put every syntax role below Lc 45. These are now solved per-mode against APCA.

**UI semantics** — light-mode `warning` shipped as near-black mud in every generated theme because the solid fill was held to a 4.5:1 text rule; fills now use the 3:1 non-text rule with chroma retention, and new `error-text` / `warning-text` / `success-text` tokens carry the strict contrast. `secondary` and `tertiary` no longer collapse. Border tokens moved into the right band in light mode, and diamond's hard shadows are now visible in dark mode.

**Palettes** — scheme slots take absolute lightness targets rather than deltas from the seed, giving every palette a real value structure (palettes with no dark anchor: 87 of 160 → 0; median lightness range 0.43 → 0.72). The non-monotone lightness reflection that inverted the intended value order in 60 of 160 palettes is gone.

**New:** `npm run check` runs a dependency-free invariant suite over 384 generated themes (role separation including CVD, contrast floors, selection legibility, style hue invariance, surface ladder, determinism, degenerate seeds).
