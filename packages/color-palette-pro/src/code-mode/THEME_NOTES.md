# Theme mining notes

Survey of well-loved VS Code themes for ideas to pull into the code-mode generator.
Source themes: GitHub Dark, Cobalt2, Kanagawa, Dracula, Catppuccin (frappe/latte/macchiato/mocha), Night Owl, 2026 (light/dark).

## Syntax-token moves we don't currently make

### 1. Bold control-flow keywords (Kanagawa)
Kanagawa splits `keyword.control.flow|conditional|loop` from regular keywords with bold weight,
making `if/for/while/return` visually heavier than `import/const/let`. Adds genuine scanning ergonomics —
your eye finds control flow first. We currently lump all keywords into one role.

### 2. `variable.language` (this/self/super) italic + accent (Dracula)
We already color these with `accentColor`, but we don't italicize. Several themes italicize
`this/self/super/null/undefined` consistently as "the language is talking now" — a strong identity marker.

### 3. Parameter italics (Catppuccin, Night Owl, Dracula)
`variable.parameter` italicized is the single most beloved signature move across modern themes.
Currently parameters share the (quiet) variable color with no styling. A per-character knob
(italicized in `circle`/`diamond`, plain in `square`) could carry real personality.

### 4. `keyword.operator.new` bold (Catppuccin, Dracula)
A universal "construction" emphasis — `new Foo()` reads as a structural event. One scope, big impact.

### 5. String escape sequences bold + accent (GitHub)
`string.regexp constant.character.escape` and `constant.character.escape` bolded inside strings —
adds depth without expanding the palette.

### 6. Decorator/annotation italics (Catppuccin)
`@decorator` (Python/TS), `#[derive]` (Rust attrs), JSX attribute names. Italicized, these become
tactile metadata layers separate from the code they annotate.

### 7. Try/catch gets the error color (Kanagawa)
Kanagawa colors `keyword.control.trycatch` with the *error* hue + bold. Try/catch is structurally
error handling, so this is a self-documenting semantic. Cinematic-lens material.

## UI / surface signature moves

### 8. Inactive selection in a complementary hue (Night Owl)
Night Owl's inactive selection is purple (`#7e57c25a`) over a blue editor — not a dimmed focus color.
We could pull this from `palette[1]` (complementary), `palette[3]` (analogous), etc. — gives selection
a per-template character.

### 9. Solid lineHighlight instead of alpha-on-fg (Kanagawa)
Kanagawa uses `#2A2A37` (a solid, slightly chroma-shifted tone of bg), not alpha-blended foreground.
Reads cleaner under bracket guides and gutter widgets. We could use `surfaces.containerSunken` mixed
slightly toward primary hue.

### 10. Selection alpha as a personality dial
Catppuccin: ~25% alpha (ghosted). 2026-dark: ~87% alpha (almost solid). Right now we ramp to legibility
but could let lens character bias the starting alpha — Expressive/Cinematic = bolder selection.

## Structural improvements

### 11. Markdown bold uses its own color (Dracula pattern)
Dracula gives `markup.bold` orange, distinct from headings (purple). We use `accentColor` for bold and
`keywordColor` for italic — close, but the pair could be tuned per template so the contrast is meaningful
(for `mono`, bold = numberColor, italic = stringColor, since there are fewer hues to spend).

### 12. Per-character semantic-token enhancements
Catppuccin defines `variable.readonly`, `variable.defaultLibrary`, `enumMember`, `class.builtin`
separately. We could fan these out in `generateSemanticTokenRules`:
- `variable.readonly` → accentColor (already done)
- `variable.defaultLibrary` → typeColor desaturated
- `enumMember` → numberColor (already done — good)
- `class.defaultLibrary` → accentColor

## Suggested first-pass cluster

Pure-additive, template-agnostic, ~5-15 lines each:
- Control-flow split
- Parameter italics tied to character
- `keyword.operator.new` bold
- Escape-sequence bold
- `variable.language` italic
