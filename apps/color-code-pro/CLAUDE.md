# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server (Vite)
pnpm build      # Type-check + build (tsc -b && vite build)
pnpm lint       # ESLint
pnpm preview    # Preview production build
```

No test suite exists.

## Architecture

Freaky Shiki is a browser-based code syntax highlighter UI that generates Shiki-compatible themes from a user-chosen
base color. Users pick a color, a color harmony type, and a shape variant — the app derives a full light/dark theme pair
and renders live-highlighted code.

**Data flow:**

1. `ThemeProvider` (`src/context/themeProvider.tsx`) is the single source of truth. It holds `baseColor`, `paletteKind`
   (`ana|tas|tri|tet|com|spl`), and `paletteStyle` (`square|triangle|circle|diamond`). All three are persisted to
   `localStorage`.
2. On every change, `@royalfig/color-palette-pro` (external package) is called via `createPalettes` →
   `generateCodeThemePair` to produce a `{ light, dark }` `CodeThemeOutput` object (`activeTheme`). A second call to
   `generateCssVariables` writes UI color CSS custom properties directly into `<head>` as `#color-vars`.
3. `FreakyShiki` (`src/components/Container/Container.tsx`) consumes `useTheme()` and owns editor state: selected
   language, textarea ref (uncontrolled), and rendered HTML. On each keystroke it calls `highlightCode` in
   `src/lib/shiki.ts`, which passes the code + `activeTheme` to the Shiki `createHighlighterCore` singleton.
4. `Editor` (`src/components/Editor/Editor.tsx`) is a thin presentational component: a `<textarea>` overlaid on top of
   Shiki-rendered HTML via absolute positioning. The `--cc-line-col` CSS variable (hardcoded `3rem` in Container, must
   match `index.css`) controls line-number column width.

**Key details:**

- Shiki highlighter is initialized once as a module-level promise (`highlighterPromise`) with all supported languages
  pre-loaded. Themes are added lazily via `highlighter.codeToHtml` (Shiki v4 accepts a `ThemeRegistration` object
  directly).
- The "Copy" button outputs a custom HTML snippet (`codeWrapper`) — not raw code — intended for embedding in other
  sites.
- Prettier runs in-browser (all plugins imported from `prettier/plugins/*`) for the Format button. Not all languages
  support formatting (Python and BASH are excluded from `LANG_PRETTIER`).
- Path alias `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
