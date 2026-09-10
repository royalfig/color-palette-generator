---
'@royalfig/color-palette-pro': patch
---

Brighten the light-mode surface to OKLCH L 0.991 (Radix slate1). The previous value matched Material 3's L 0.984, which assumes the page fills the frame — in a browser the surrounding chrome is pure white and sits directly against the page, where an off-white ground reads as dingy. This more than halves the perceptual gap to white while keeping enough chroma headroom for the tinted styles; pure white was rejected because at L 1.000 no chroma is achievable at all.
