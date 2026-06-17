---
"@royalfig/color-palette-pro": patch
---

Fix chroma editing and make palette gamut clamping display-aware.

- `colorFactory` no longer reduces the stored color's chroma to the sRGB gamut up front. That clamp made the OKLCH chroma slider snap back to the sRGB boundary; output stays gamut-safe because every serialized form (hex/rgb/hsl/fallback) gamut-maps hue-stably on its own.
- Palette generators now clamp generated swatches to the *selected display gamut* (`gamutForSpace`): sRGB/HSL stay sRGB, while P3/OKLCH/OKLab/LCH/Lab target P3 — so wide-gamut modes produce vibrant, P3-realizable swatches instead of muting to sRGB.
