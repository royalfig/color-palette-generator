---
'@royalfig/color-palette-pro': minor
---

UI palette: keep the primary on the seed, realize brand colours in the selected space's gamut, and guarantee their contrast.

- **The primary keeps the seed's lightness.** An out-of-gamut seed now has only its chroma reduced, holding lightness and hue (CSS Color 4 gamut mapping). Lightness moves only when that would leave the colour close to neutral. Previously any seed whose chroma could not reach half of what was asked was moved toward the hue's cusp: `oklch(56% 0.28 66.1)` became L 0.63 and then failed light-mode contrast, so light mode got L 0.53 instead of the seed's 0.56. The other mode's primary now carries the requested chroma, and the contrast it copies from the seed's own mode is capped at 7:1, so seeds near black or white no longer get a white or black primary in the other mode.
- **Wide-gamut output.** Each colour space now has its own gamut limit: sRGB and HSL stay sRGB, P3 uses Display P3, and the unbounded spaces (OKLCH, OKLab, LCH, Lab) use Rec. 2020, the widest gamut real displays reach. Previously the unbounded spaces were limited to P3. This applies to the base palette and, newly, to the UI's primary, secondary, tertiary and their on- and container colours, which were sRGB-only. Each UI pair must clear 4.5:1 in every form it can be seen in: the wide value, its P3 mapping (for Rec. 2020), and its sRGB hex fallback. Semantics, surfaces, outlines and code mode stay sRGB.
- **Contrast fixes in every gamut.** On-colours are clamped to gamut before they are measured, and fall back to pure white or black, which every colour passes against, before giving up. Accents are verified with the same 8-bit hex margin as the primary. Across a 160-seed grid × 4 kinds × 4 styles × 2 modes, brand-pair failures went from 346 (sRGB) and 958 (OKLCH) to 0.
- **Distinct brand colours.** Secondary and tertiary are now placed together, keeping them clear of the primary as well as each other. They previously never looked at the primary, so a seed near their fixed lightness targets produced a near-duplicate accent, especially on tints & shades and grey-ish seeds. Themes where two brand colours sit within ΔE 5 went from 1,044 (sRGB) and 748 (OKLCH) to 0.

On-colours and semantic on-colours shift slightly (about ΔE 1.5) in most themes, because they are now built from in-gamut colours.
