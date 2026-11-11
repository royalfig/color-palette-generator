---
'@royalfig/color-palette-pro': patch
---

Light-mode `container-overlay` now sits above the page instead of below it. It moves 85% of the way from the surface to white and carries half the surface's tint, so square/triangle overlays are near-white (`#fefefe`) and circle/diamond overlays are a pale wash of the page hue. Previously it used Material 3's surfaceContainerHigh (L 0.933), which made every popover a grey panel darker than the cards and turned diamond overlays a muddy grey. Light floating panels should get their edge from the `shadow` token and an `outline-variant` border. Dark mode is unchanged.
