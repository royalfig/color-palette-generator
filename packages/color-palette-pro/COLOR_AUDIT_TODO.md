# Color Logic Audit — Implementation Plan

Source: multi-agent audit (color science, color psychology/semantics, design systems) of
`packages/color-palette-pro/src/`. This document tracks every finding and its fix. Check
items off as they land. Severity: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low.

The generation flow: user color → OKLCH palette generators (`analogous`/`complementary`/
`triadic`/`tetradic`/`splitcomp`/`tints-and-shades`) → `modifiers` → `ui.ts` (M3-style
tokens) and `code-mode/` (editor/terminal themes).

---

## Phase 0 — Verification harness (do first)

There are currently **no tests**. Before changing color math, build a way to catch regressions.

- [x] **0.1** Add `scripts/verify-color.mts` (run via `tsx`): for a matrix of seed colors
  (including achromatic `#000`/`#fff`/`#888`, and high-chroma yellow/blue extremes) × every
  palette kind × every style, assert invariants:
  - every emitted color is in sRGB gamut (pre-output, not just after `toGamut`)
  - no `NaN` hue/chroma/lightness leaks into output
  - UI tokens meet their stated contrast (on-X vs the background X actually sits on)
  - semantic error/success/warning remain mutually distinct under CVD simulation
- [x] **0.2** Wire `pnpm verify` (or a package script) and run it after each phase.

---

## Phase 1 — Foundational color-correctness (root causes; unblocks everything)

### 1A. Gamut-aware chroma 🔴
The whole pipeline sets `oklch.c` directly and only gamut-maps at output (`factory.ts`,
`code-mode/utils.toHex`). Flat constant ceilings (`0.37` in `utils.ts`/`enhancer.ts`, `0.4`
in `modifiers.ts`, `0.15` in `polishPalette`) don't match real per-(L,H) sRGB limits, so
distinct swatches collapse onto the gamut boundary at output → flat/banded palettes.

- [x] **1A.1** Add `color-math.ts` helpers: `maxChromaFor(l, h, space='srgb')` (binary search
  on chroma until in gamut) and `clampChromaToGamut(color)` (reduce C holding L+H via
  `toGamut({ space:'srgb', method:'oklch' })`).
- [x] **1A.2** Replace the constant `OKLCH_LIMITS.c.max = 0.37` clamp in `clampOKLCH`
  (`utils.ts:14,21`) with gamut-aware reduction.
- [x] **1A.3** Replace flat chroma clamps in `enhancer.ts` (`:303` `0.37`, `:416` `0.37`,
  `:359` `*1.1`), `modifiers.ts` (`0.4` ×3), `tints-and-shades.ts:111` (`0.37`).
- [x] **1A.4** Run generated colors through gamut reduction *inside* each generator so the
  intended chroma relationships survive to output.

### 1B. Achromatic / NaN-hue handling 🟠
`oklch.h` is `NaN` for gray inputs; `?? 0`/`|| 0` silently coerces to **0° (red)** in every
generator and modifier, so a gray seed yields a red palette.

- [x] **1B.1** Add `isAchromatic(color)` + `safeHue(color, fallback?)` to `utils.ts`.
- [x] **1B.2** At the top of each generator, detect achromatic input and either produce a
  neutral (grayscale) palette or use an explicit, documented seed hue — not silent 0°.
- [x] **1B.3** Fix `modifiers.ts` `newColor.oklch.h || 0` (`:26` etc.) so a NaN hue isn't
  written back as 0 (re-chromatizing neutrals). Normalize all hue wraps to `((h%360)+360)%360`
  (sineModifier `:27` lacks the `+360`).

### 1C. OKLCH-vs-HSL chroma unit confusion 🟠
Branches gated on `chroma > 0.8` are **dead code** (sRGB OKLCH chroma tops ~0.32);
`chroma < 0.3` "daylight" branches fire almost always. Thresholds were written for a 0–1
saturation scale.

- [x] **1C.1** Define OKLCH chroma bands (`LOW_C ≈ 0.05`, `HIGH_C ≈ 0.15`) and rescale every
  `chroma > 0.8` / `chroma < 0.3` test in `complementary.ts`, `analogous.ts`, `triadic.ts`,
  `tetradic.ts`, `splitcomp.ts`.

---

## Phase 2 — Accessibility & contrast (highest user-visible/safety impact)

### 2A. Semantic hue drift 🟠
`findColorByHue(palette, 27/140/83, tolerance=30)` can return orange-as-error, teal-as-success.
The fixed-hue fallback is *more* correct than the matched path. Hue is meaningless at low chroma.

- [x] **2A.1** Pin semantic *hue* to canonical (error 27, success ~145, warning 83, info 220);
  borrow only chroma/character from the palette. Or shrink tolerance to ~10–12° **and** require
  a min chroma to qualify, then snap hue back to canonical. (`ui.ts:342-372`, `color-math.ts:56-76`,
  `code-mode/index.ts:318-337`.)

### 2B. CVD-safe semantics 🟠
Error(red 27) and success(green 140) are forced to near-equal lightness in light mode
(`ui.ts:383,388` both L=0.4) → indistinguishable for red-green CVD (~8% of men). No mutual
distinctness check among error/warning/success/info.

- [x] **2B.1** Separate error/success by **lightness** as well as hue (e.g. keep error darker).
- [x] **2B.2** Add a CVD-aware mutual-distinctness pass for {error, warning, success, info}
  (simulate deutan/protan, require min perceptual distance). Reuse the `enforceDistinction`
  pattern from `code-mode/index.ts:125`.
- [x] **2B.3** Verify palette-matched semantics are saturated enough to read as the semantic
  color (chroma floor after match). (`ui.ts:346/355/365`.)

### 2C. Unverified contrast tokens 🟠
Primary routes through verified contrast search; secondary/tertiary/info/`outline-variant`
do not — safe only by luck of the current constants.

- [x] **2C.1** Route secondary/tertiary L through `findLightnessFromTarget(..., surface, 4.5,
  targetL)` like primary. (`ui.ts:464-474`; `code-mode/index.ts:309,338`.)
- [x] **2C.2** `outline-variant` (~1.2:1) is wired as the functional input/focus border in
  code-mode (`templates/base.ts`) — WCAG 1.4.11 needs 3:1. Introduce/point a 3:1-verified
  border token for inputs/focus; keep decorative `outline-variant` for dividers only.
  (`ui.ts:304-310`, `code-mode/index.ts:179-196`.)

### 2D. Contrast model correctness 🟡
- [x] **2D.1** `findOptimalLightness` (`color-math.ts:16-39`) gamut-maps nothing and assumes
  WCAG-contrast is monotonic in OKLCH L (false near gamut edge). Gamut-map each candidate
  before measuring; re-verify the chosen color post-mapping.
- [x] **2D.2** Evaluate APCA for the M3 token set (code-mode already uses APCA). At minimum
  document the WCAG2 limitation for dark mode. (`ui.ts`, `color-math.ts`.)
- [x] **2D.3** `worstCaseBackground` only covers the neutral surface stack; `on-surface` isn't
  verified against tinted containers it's often painted on. Document the guarantee scope, or
  verify against the darkest/lightest container too. (`ui.ts:258-276`.)

---

## Phase 3 — Perceptual model honesty

### 3A. "Muddy zone" hue exclusion 🟠/psych
`avoidMuddyZones` (`enhancer.ts:339-365`) shoves whole hue bands ("corpse-cyan", "sick-green",
"brown-olive", "dead-orange") out by ±10°, destroying palette geometry and the user's own
earthy/teal brand hues. The `[45,55]` zone is dead (contained in `[25,65]`). Muddiness is
low-chroma-at-mid-L, not a hue band.

- [x] **3A.1** Rewrite muddiness as a function of chroma×lightness; nudge chroma/lightness
  rather than teleporting hue. Remove overlapping/dead ranges and the loaded names. Never
  silently relocate a hue near the user's base.

### 3B. Bezold–Brücke / Abney compensation 🟠/science
`tints-and-shades.ts:161-205`: arbitrary gains (×−8, ×−40), ambiguous sign, only a few hue
bands covered → inconsistent around the wheel; Abney only on the lighten branch.

- [x] **3B.1** Either ground B–B/Abney in real data (continuous curves) or drop the
  perceptual labeling and treat as a documented aesthetic tweak. Cover the whole wheel
  consistently or not at all.

### 3C. Discontinuous "perceptual/optical" hue tables 🟡/science
Piecewise-linear hue maps with hard branch boundaries cause 30–60° complement swings for ~1°
input changes (`complementary.ts:22-55` and the optical/adaptive/luminosity variants across all
generators).

- [x] **3C.1** Replace branch tables with continuous functions (opponent-space reflection /
  measured complementary data) or smooth the boundaries.

### 3D. Emotion→hue claims & narrative labels 🟡/psych
Fixed hue→emotion lookups (`complementary.ts:57-93`) are folk psychology presented as
mechanism, internally inconsistent (blue both "tranquil" and "mysterious"); `c*l` "intensity"
is a poor proxy. Narrative names ("emotional crescendo", "four-act epic") overclaim.

- [x] **3D.1** Demote emotion language to "harmony heuristic"; fix `intensity` to use chroma
  (relative to gamut) not `c*l`; justify or drop the 30/90/150/210/270 breakpoints.
- [x] **3D.2** Reframe chroma-narrative descriptions as verifiable effects (visual energy /
  focal hierarchy). Add a brief cultural-variance + heuristic disclaimer in docs.
  The `code-mode` personality/character subsystem (reasons from scheme *relationships*) is the
  model to emulate.

### 3E. `polishPalette` non-perceptual hacks 🟡
Index-parity saturation decisions (`enhancer.ts:422`), `sin(h)*5` "noble darks" (`:407`),
chroma floors that re-chromatize deliberately-neutral colors (`:384,394`).

- [x] **3E.1** Remove index-parity logic; make "cool-tinted darks" a real lerp toward ~250°
  with small weight; ensure floors don't fight intended neutrals; apply before (not after)
  gamut/contrast reasoning.

---

## Phase 4 — Design-system completeness & code-mode

### 4A. M3 "Tone" mislabel 🟠
Comments say "Tone 40/80/90" but assign OKLCH L (HCT tone ≈ CIE L*, a different scale).

- [x] **4A.1** Rename comments "Tone N" → "OKLCH L 0.NN" and drop M3-fidelity claims, OR
  generate tonal ramps in HCT and convert at emit. (`ui.ts` pervasive.)

### 4B. Surface tint below JND 🟡
Neutral surface chroma caps (0.002–0.012) are at/below perceptible threshold — "tinted
neutrals" read as pure grey.

- [x] **4B.1** Raise neutral tint caps (~0.006–0.010 light, ~0.010–0.018 dark);
  keep ΔL as primary differentiator. (`ui.ts:120-125,230-256`.)

### 4C. Elevation steps 🟡
Light-mode container/overlay ΔL is tiny (overlay 0.995 ≈ surface 0.99) with no shadow token.

- [x] **4C.1** Widen light-mode elevation; add a shadow/elevation token; document overlay
  depends on shadow. (`ui.ts:234-256`.)

### 4D. Missing tokens 🟠
No interaction states (hover/pressed/focus/disabled / state-layer opacities), no scrim, no
shadow, no `surface-tint`. The "34 tokens" count is a magic number.

- [x] **4D.1** Emit state-layer opacity tokens (or pre-mixed states) per accent; add scrim +
  shadow. Drive token count from a typed role enum, not a hardcoded comment. (`ui.ts:499-606`.)

### 4E. `getAccessibleVariant` chroma floor 🟡
Forced `c=0.06` + L snap to 0.9/0.12 is invisible at the poles (on-colors) but applied anyway;
"keeps on-colors visibly tinted" comment overstates. (`ui.ts:42-69`, `code-mode/utils.ts:10-32`.)

- [x] **4E.1** Scale chroma floor by distance of L from neutral midpoint, or only apply in the
  container path where it's visible.

### 4F. ANSI terminal colors 🟡
`ansiMagenta = shiftHue(definition, 120)`, `ansiCyan = shiftHue(definition, -60)` can land far
from magenta/cyan; the 16 ANSI colors aren't contrast-checked vs terminal bg.
(`code-mode/index.ts:414-421`, `utils.brightAnsiHex`.)

- [x] **4F.1** Snap magenta/cyan to canonical hue ranges (~330 / ~195); run all 16 ANSI colors
  through an APCA floor against the terminal background.

### 4G. Selection alpha in terminal formats ⚪
Ghostty/iTerm2 strip alpha and use full-opacity focus color for selection → can erase selected
text. (`formats/ghostty.ts`, `formats/iterm2.ts`; `legibleOverlayAlpha` exists but unused there.)

- [x] **4G.1** Composite selection to a solid hex at the computed legible alpha for the
  alpha-less formats.

### 4H. Inverse surface cohesion ⚪
`inverse-surface`/`on-inverse-surface` forced to chroma 0 while everything else is tinted.
(`ui.ts:312-317`.) Optional: allow a whisper of tint for cohesion.

---

## Phase 5 — Minor correctness

- [x] **5.1** `tints-and-shades.findBaseColorPosition` mutates progression and can break
  monotonicity for some base L. Guarantee a monotone ramp. (`tints-and-shades.ts:263`.)
- [x] **5.2** `generateDiamondStyle`/`generateCircleStyle` ignore params and discard the
  `steps()` L. Simplify or use the mixed result. (`tints-and-shades.ts:121-158`.)
- [x] **5.3** `getMedianChroma` mixes chroma across hues then gets clamped anyway — make it
  hue-aware or simplify. (`color-math.ts:44-54`, `ui.ts:350`.)
- [x] **5.4** `isLight` uses bare OKLCH L≥0.5 (ignores Helmholtz–Kohlrausch). Prefer the
  contrast-vs-white/black approach used in `factory.ts:128`. (`utils.ts:62-70`.)
</content>
