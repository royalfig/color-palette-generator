# Surface & UI notes

Where the code-mode generator is weakest: the chrome around the syntax. This note maps
modern editor-UI patterns (anchored on 2026 Dark/Light) onto our current output, and
flags the gaps.

## How we differ from 2026

### 2026 Dark surface stack (lightness, OKLCH-ish)
```
editor          #121314  L ≈ 0.07
sidebar/panel   #191A1B  L ≈ 0.11
widget/overlay  #202122  L ≈ 0.14
borders         #2A2B2C  L ≈ 0.17  (barely visible)
```
Editor is the **deepest** point. Chrome lifts *above* the document.

### Our current dark surface stack
```
containerSunken (sidebar)  L 0.10  ← darker than editor
surface (editor)           L 0.14
container (panel)          L 0.19
containerOverlay (widgets) L 0.25
outline                    L 0.55  ← extremely visible
```
Editor floats *above* sidebar. This is the older Solarized/One Dark/Monokai pattern.
Modern Microsoft Dark Modern, GitHub Dark, Catppuccin Mocha, 2026, Night Owl all
invert this — editor is deepest.

## The most impactful changes

### 1. Invert the dark-mode hierarchy (editor as anchor)
Make sidebar / activityBar / panel / statusBar **brighter** than editor in dark mode.
Light mode is already close — just narrow the gap between editor and sidebar (2026
uses ~0.02 L; we use ~0.08).

Effect: chrome reads as a "frame" around the document instead of competing with it.
Active-tab / breadcrumb / editorGutter all already merge with editor.background in
most modern themes — the inverted hierarchy makes that merge a feature, not a quirk.

Lens dial: `square` (Engineered) could keep the classic inverted-anchor pattern at
the modern Microsoft spacing; `diamond` (Cinematic) could deepen the editor more
aggressively for theatrical contrast.

### 2. Outline / border L is way too high
Our `outline` sits at L=0.55 (dark) — a visible mid-gray line. 2026 borders sit at
L≈0.17 — just barely separated from the surface. Result: our themes look "boxy"
where modern themes look continuous.

Fix: drop outline to L≈0.17 dark / L≈0.92 light. Keep the brighter L=0.55 outline
reserved for `focusBorder` only (where you actually want the line to assert).

### 3. Unified chromatic highlight family (the 2026 signature)
2026 dark generates an *attention layer* by riffing one primary tint across alphas:
```
selectionBackground          #276782dd   ~87%
findMatchBackground          #27678290   ~57%
wordHighlightStrongBackground #27678280  ~50%
findMatchHighlightBackground #27678280   ~50%
inactiveSelectionBackground  #27678260   ~38%
selectionHighlightBackground #27678260   ~38%
wordHighlightBackground      #27678250   ~31%
```
One hex prefix, seven alphas — all reads as "the editor is attending to this."

Our current code distributes these across `focusBorder`, `accentColor`, and
`infoForeground` — semantically meaningful but visually scattered. Switching to a
single source-hue ramp would give every theme an immediately legible attention
language.

### 4. Neutral "incidental attention" layer
2026 dark uses one solid neutral (`#242526`) for `lineHighlightBackground`,
`rangeHighlightBackground`, `hoverHighlightBackground`, `findRangeHighlightBackground`.
Not chromatic, not alpha-blended — a solid surface tone one step above editor.

We currently set `lineHighlightBackground` to alpha-on-foreground (5% in dark). This
*technically* contrasts, but it interacts badly with bracket guides, indent guides,
and minimap rendering. A solid neutral is structurally cleaner.

Rule: chrome is neutral, attention is chromatic. Right now we tend to alpha-blend
both, which blurs the distinction.

### 5. Inactive selection: neutral vs chromatic (lens knob)
2026 uses a *neutral* solid (`#2C2D2E`) for inactive selection — when focus leaves,
chromatic identity goes with it. Other themes (Night Owl) use a *complementary hue*
to keep character. Both are defensible.

Mapping to lenses:
- `square` (Engineered): neutral 2026-style
- `triangle` (Natural): neutral, slightly tinted
- `circle` (Expressive): primary at low alpha (current behavior)
- `diamond` (Cinematic): complementary hue (Night Owl-style)

### 6. focusBorder with alpha
2026: `focusBorder = #3994BCB3` (primary @ ~70%). The alpha softens the focus glow
where the border meets curved chrome corners. Reads more refined than a hard-edged
solid line. Cheap and high-impact.

### 7. statusBar treatment as personality dial
2026 / Catppuccin / Dark Modern: statusBar matches sidebar (`#191A1B`) — disappears
into the frame.
Dracula / older themes: statusBar is its own color (often saturated).

We currently always primary-tint the statusBar. Could be lens-driven:
- `square`: match sidebar (minimal)
- `triangle`: tinted but quiet
- `circle`: current primary-tint
- `diamond`: deeper primary + accent border-top

## UI keys we're missing entirely

These are populated by 2026 and modern themes; we currently emit nothing for them,
so VS Code falls back to defaults that may not match our palette.

### `editorBracketMatch`
- `editorBracketMatch.background` — primary @ ~30% alpha
- `editorBracketMatch.border` — outline (the same near-invisible border tone)

Currently absent. When users click into a `{`, the matching `}` gets unstyled.

### `editorStickyScroll`
- `editorStickyScroll.background` — editor.background (continuous)
- `editorStickyScrollHover.background` — slightly lifted
- `editorStickyScroll.border` — outline
- `editorStickyScroll.shadow` — `#00000000` in light, default in dark

Sticky scroll is a recent VS Code feature; without these the sticky header looks
disconnected from the rest of the editor.

### `agents*` / `chat.*` (modern VS Code chat panel)
- `agents.background`, `agentsPanel.background/.foreground/.border`
- `agentsGradient.tintColor` (set to primary)
- `agentsChatInput.background/.foreground/.border/.focusBorder/.placeholderForeground`
- `agentsNewSessionButton.*`, `agentsBadge.*`, `agentsUnreadBadge.*`
- `chat.requestBubbleBackground/.HoverBackground`
- `chat.inputWorkingBorderColor1/2/3` (gradient triad: primary darker, primary,
  primary lighter)

The 3-color gradient on the chat input is a nice signature move — we can derive
it from primary in three lightness steps.

### `minimapSlider`
- `minimapSlider.background/.hoverBackground/.activeBackground`

Currently the minimap uses default neutral.

### `charts.*` (notebook / debug charts)
2026 maps `charts.blue/red/yellow/green/orange/purple` to themed tones. We could
derive these from the palette + semantic colors easily.

### `inlineChat.border`
2026 sets this to `#00000000` (fully transparent) — the inline chat widget gets no
visible border, relying on bg contrast alone. A small but on-trend choice.

## Smaller polish items

- `editor.foreground` and `editorCursor.foreground` are both the *foreground* color
  in 2026 dark (`#BBBEBF`). We use `accentColor` for cursor — bolder, fine for
  Cinematic/Expressive but probably too loud for Engineered/Natural.
- `tab.activeBorderTop = primary` — only chromatic accent on the tab strip; we
  already do this.
- `tab.unfocusedActiveBackground === tab.activeBackground` — when the editor group
  loses focus, the active tab stays "merged" with the editor. We don't differentiate
  unfocused tabs from focused ones; worth confirming.
- `editorGutter.background === editor.background` — implicit continuity. Worth an
  explicit emit so themes built on top of older defaults don't bleed through.
- 2026's `editor.findRangeHighlightBackground` and `editor.hoverHighlightBackground`
  use a neutral tone, NOT the primary-tinted highlight family. Splitting "user is
  pointing at this" (neutral) from "the editor is showing matches" (chromatic) is
  what makes the highlight system legible.

## Suggested first-pass cluster

If we pick the changes with the highest visual return for the least logic surgery:

1. **Drop outline L** to ≈0.17 / ≈0.92 — single-line change in `deriveOutline`
2. **Unified primary-tint highlight family** — rewrite the `selection*` / `findMatch*` /
   `wordHighlight*` block in `deriveUiColors` to all source from a single
   `semantic.focusBorder.hex` ramped through 7 alphas
3. **Solid neutral lineHighlight / rangeHighlight / hoverHighlight** — replace the
   alpha-fg derivations with a solid surface step (e.g. `surfaces.container` mixed
   slightly toward editor bg)
4. **Add editorBracketMatch + editorStickyScroll + agents/chat/minimapSlider keys**

Those four changes touch only `index.ts` (outline derivation) and `templates/base.ts`
(`deriveUiColors`), keep the syntax pipeline untouched, and would noticeably modernize
every generated theme.

The hierarchy inversion (#1 above the line) is the bigger conceptual shift and worth
discussing separately — it changes the structural philosophy of how editor and chrome
relate.
