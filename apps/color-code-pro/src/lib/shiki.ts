import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { ThemeRegistration } from "shiki";
import { LANG_LOADERS } from "./languages";

// Start with no grammars; each is fetched lazily the first time it's used so
// the initial bundle stays small regardless of how many languages we list.
const highlighterPromise = createHighlighterCore({
  themes: [],
  langs: [],
  engine: createJavaScriptRegexEngine(),
});

type Highlighter = Awaited<typeof highlighterPromise>;

// Cache the in-flight/resolved load promise per language so concurrent highlight
// calls (e.g. the copy snippet highlighting light + dark) only load each once.
const langPromises = new Map<string, Promise<void>>();

function ensureLanguage(highlighter: Highlighter, lang: string): Promise<void> {
  const loader = LANG_LOADERS[lang];
  if (!loader) return Promise.resolve();
  let promise = langPromises.get(lang);
  if (!promise) {
    promise = highlighter.loadLanguage(loader()).then(() => undefined);
    langPromises.set(lang, promise);
  }
  return promise;
}

export async function highlightCode(
  code: string,
  lang: string,
  theme: ThemeRegistration,
) {
  const highlighter = await highlighterPromise;
  await ensureLanguage(highlighter, lang);
  return highlighter.codeToHtml(code, { lang, theme });
}
