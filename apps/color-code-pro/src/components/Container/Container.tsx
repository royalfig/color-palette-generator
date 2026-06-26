import { Editor } from "@/components/Editor/Editor";

import { LangSelect, PaletteKindSelect } from "@/components/Select/Select";
import { Separator } from "@/components/Separator/Separator";
import { SettingsMenu } from "@/components/Settings/SettingsMenu";
import { ThemeDownload } from "@/components/ThemeDownload/ThemeDownload";

import { LINE_COL, SHAPES, THEME_MODES } from "@/lib/const";
import { LANG_PLACEHOLDER, LANG_PRETTIER } from "@/lib/languages";
import { canFormat, formatCode } from "@/lib/prettier";
import { CopyIcon, MagicWandIcon, CheckIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ColorPicker from "@/components/ColorPicker/ColorPicker";
import type { ThemeRegistration } from "shiki";
import { useTheme } from "../../hooks/useTheme";
import { highlightCode } from "../../lib/shiki";
import { Button, ButtonGroup, IconButton } from "../Button/Button";
import "./Container.css";
import { BaseColorData } from "@royalfig/color-palette-pro";

export function Container() {
  const {
    theme,
    setTheme,
    paletteKind,
    setPaletteKind,
    paletteStyle,
    setPaletteStyle,
    activeTheme,
    themePair,
    uiVarsPair,
    mode,
  } = useTheme();

  const [lang, setLang] = useState(
    () => localStorage.getItem("lang") || "typescript",
  );

  const [copyButtonIconToUse, setCopyButtonIconToUse] = useState(
    <CopyIcon size={14} />,
  );

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const savedCode = useRef<Record<string, string>>({ ...LANG_PLACEHOLDER });
  const textRef = useRef<HTMLTextAreaElement>(null);
  const highlightSerial = useRef(0);

  const handleLangChange = useCallback(
    (newLang: string) => {
      if (textRef.current) {
        // Persist the current language's edits, then load the target
        // language's own code (its prior edit, or the stock sample).
        savedCode.current[lang] = textRef.current.value;
        textRef.current.value =
          savedCode.current[newLang] ?? LANG_PLACEHOLDER[newLang] ?? "";
      }
      setLang(newLang);
    },
    [lang],
  );

  const editorBg = activeTheme.colors["editor.background"];
  const formatSupported = canFormat(LANG_PRETTIER[lang]);

  // The theme control is a single button that cycles dual → light → dark,
  // showing the current mode's icon.
  const currentMode =
    THEME_MODES.find((m) => m.value === theme) ?? THEME_MODES[0];
  const ModeIcon = currentMode.Icon;
  const cycleTheme = () => {
    const i = THEME_MODES.findIndex((m) => m.value === theme);
    setTheme(THEME_MODES[(i + 1) % THEME_MODES.length].value);
  };

  const doHighlight = useCallback(
    async (code: string) => {
      const serial = ++highlightSerial.current;
      const html = await highlightCode(
        code,
        lang,
        activeTheme as ThemeRegistration,
      );
      if (html && serial === highlightSerial.current) setRenderedHtml(html);
    },
    [lang, activeTheme],
  );

  useEffect(() => {
    const code = textRef.current?.value || "";
    if (!code) return;
    doHighlight(code);
  }, [doHighlight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      savedCode.current[lang] = e.target.value;
      doHighlight(e.target.value);
    },
    [lang, doHighlight],
  );

  const handleFormat = useCallback(async () => {
    const parser = LANG_PRETTIER[lang];
    if (!canFormat(parser) || !textRef.current?.value) return;
    try {
      const formatted = await formatCode(textRef.current.value, parser);
      textRef.current.value = formatted;
      savedCode.current[lang] = formatted;
      await doHighlight(formatted);
    } catch (err) {
      console.error(err);
    }
  }, [lang, doHighlight]);

  const copy = useCallback(async () => {
    const code = textRef.current?.value;
    if (!code) return;

    let snippet: string;
    if (theme === "dual") {
      // Ship both variants with baked token colors. The frame is driven by the
      // --color-* vars in the downloaded base.css, which also hides the
      // non-matching block via prefers-color-scheme. Web-only (needs base.css).
      const [lightHtml, darkHtml] = await Promise.all([
        highlightCode(code, lang, themePair.light as ThemeRegistration),
        highlightCode(code, lang, themePair.dark as ThemeRegistration),
      ]);
      if (!lightHtml || !darkHtml) return;
      snippet = dualWrapper(lang, lightHtml, darkHtml);
    } else {
      // One self-contained variant with literal colors — works on the web AND
      // in email (no external CSS, no prefers-color-scheme).
      const scheme = theme === "dark" ? "dark" : "light";
      const html = await highlightCode(
        code,
        lang,
        themePair[scheme] as ThemeRegistration,
      );
      if (!html) return;
      snippet = codeBlock(lang, html, frameColors(uiVarsPair[scheme].palette));
    }

    await navigator.clipboard.writeText(snippet);
    setCopyButtonIconToUse(<CheckIcon size={14} />);
    setTimeout(() => {
      setCopyButtonIconToUse(<CopyIcon size={14} />);
    }, 2000);
  }, [lang, themePair, theme, uiVarsPair]);

  return (
    <div className="cc-card">
      {/* Header */}
      <div className="cc-header">
        <div className="cc-header-left">
          {/* Color picker */}
          <ColorPicker />
        </div>

        <div className="cc-header-right">
          {/* Palette kind */}
          <PaletteKindSelect
            paletteKind={paletteKind}
            setPaletteKind={setPaletteKind}
          />

          <Separator />

          <ButtonGroup label="Palette shape">
            {SHAPES.map(({ value, Icon }) => (
              <IconButton
                key={value}
                variant="ghost"
                aria-pressed={paletteStyle === value}
                aria-label={value}
                onClick={() => setPaletteStyle(value)}
                className={paletteStyle === value ? "cc-btn-active" : ""}
              >
                <Icon size={14} />
              </IconButton>
            ))}
          </ButtonGroup>

          <Separator />

          <IconButton
            variant="ghost"
            aria-label={`Theme: ${currentMode.label} — click to cycle`}
            onClick={cycleTheme}
          >
            <ModeIcon
              size={14}
              weight={currentMode.value === "dual" ? "fill" : "regular"}
            />
          </IconButton>

          <Separator />

          <SettingsMenu />
        </div>
      </div>

      <Editor
        editorBg={editorBg}
        renderedHtml={renderedHtml}
        textRef={textRef}
        onChange={handleChange}
        lineCol={LINE_COL}
        defaultValue={LANG_PLACEHOLDER[lang]}
      />

      {/* Footer */}
      <div className="cc-footer">
        <div className="cc-footer-left">
          {/* Lang selector */}
          <LangSelect handleLangChange={handleLangChange} lang={lang} />

          {formatSupported && (
            <>
              <Separator />

              <IconButton
                variant="ghost"
                aria-label="Format"
                onClick={handleFormat}
              >
                <MagicWandIcon size={14} />
              </IconButton>
            </>
          )}
        </div>

        <div className="cc-footer-right">
          {mode === "snippet" ? (
            <Button
              variant="primary"
              icon={copyButtonIconToUse}
              aria-label="Copy embed snippet"
              onClick={copy}
            >
              Copy Snippet
            </Button>
          ) : (
            <ThemeDownload />
          )}
        </div>
      </div>
    </div>
  );
}

// The frame around Shiki's output: border, background, and the language label.
// Single-theme snippets pass literal hex so the block is fully self-contained
// (email keeps inline styles but strips <style>/class rules). Dual snippets pass
// var(--…) refs that resolve from the downloaded base.css instead.
type FrameColors = { fg: string; outline: string; bg: string };

// Literal frame colors for one scheme, pulled from its UI palette. Used by the
// self-contained single-theme snippets.
const frameColors = (palette: BaseColorData[]): FrameColors => {
  const pick = (code: string) => palette.find((x) => x.code === code)?.string;
  const fg = pick("on-surface-variant");
  const outline = pick("outline-variant");
  // `container` (not `surface`) so the header bar matches the app's card/header,
  // whose value shifts across palette styles.
  const bg = pick("container");
  if (!fg || !outline || !bg) {
    throw new Error("Missing UI frame color (container/outline/on-surface)");
  }
  return { fg, outline, bg };
};

// Frame driven by the --color-* custom properties base.css emits per scheme.
// Used by dual snippets, where each block's literal scheme would be redundant
// (base.css already hides the non-matching one) — the vars keep both blocks in
// sync with whatever the included base.css defines.
const VAR_FRAME: FrameColors = {
  fg: "var(--color-on-surface-variant)",
  outline: "var(--color-outline-variant)",
  bg: "var(--color-container)",
};

// One block: a bordered, rounded container holding a header bar (frame bg + the
// language label, divided from the body by a bottom border) and Shiki's <pre>
// (its own baked code-area background). Plain block-level divs — they stack and
// render in email too; only border-radius/overflow degrade in Outlook, which a
// table wouldn't save anyway. No copy button in the markup: base.js overlays one
// on the web (it never runs in email, which is the point), anchored to the
// .cc-code container via position:relative.
const codeBlock = (
  lang: string,
  shikiHtml: string,
  { fg, outline, bg }: FrameColors,
) => {
  const CONTAINER =
    `margin:16px 0;border:1px solid ${outline};` +
    `border-radius:8px;overflow:hidden;background:${bg};`;

  const HEADER =
    `position:relative;padding:8px 12px;background:${bg};border-bottom:1px solid ${outline};` +
    `color:${fg};font-family:ui-monospace,'Cascadia Code',Menlo,Consolas,monospace;` +
    `font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;`;

  const PRE_INLINE =
    `margin:0;padding:16px;overflow-x:auto;white-space:pre;` +
    `font-family:ui-monospace,'Cascadia Code',Menlo,Consolas,monospace;` +
    `font-size:13px;line-height:1.5;`;

  // Prepend our styles onto the <pre>'s existing inline style, keeping Shiki's
  // baked background-color + token color.
  const inlinePreStyles = (html: string) =>
    html.replace(/(<pre\b[^>]*\bstyle=")/, `$1${PRE_INLINE}`);

  return (
    `<div class="cc-code" data-lang="${lang}" style="${CONTAINER}">` +
    `<div style="${HEADER}">${lang}</div>` +
    inlinePreStyles(shikiHtml) +
    `</div>`
  );
};

// Dual mode ships both variants wrapped in .cc-light/.cc-dark; base.css toggles
// them via prefers-color-scheme. Web-only — email has no way to hide one, so
// light/dark mode exists for newsletters.
const dualWrapper = (lang: string, lightHtml: string, darkHtml: string) =>
  `<div class="cc-light">${codeBlock(lang, lightHtml, VAR_FRAME)}</div>` +
  `<div class="cc-dark">${codeBlock(lang, darkHtml, VAR_FRAME)}</div>`;
