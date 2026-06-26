import type { Plugin } from "prettier";

/**
 * On-demand Prettier formatting.
 *
 * Prettier and its plugins are heavy, so nothing here is imported statically —
 * the standalone formatter and only the plugin(s) a given parser needs are
 * dynamically imported the first time the user hits Format. The bundler keeps
 * each as its own chunk and caches it, so repeat formats don't refetch.
 *
 * Parser → plugin mapping mirrors Prettier 3's package layout:
 *   - babel / typescript / json print via the shared `estree` plugin
 *   - css / scss / less          → postcss
 *   - html / vue                 → html
 *   - markdown / yaml / graphql  → their like-named plugins
 */

type PluginLoader = () => Promise<{ default: Plugin }>;

const estree: PluginLoader = () => import("prettier/plugins/estree");
const babel: PluginLoader = () => import("prettier/plugins/babel");
const typescript: PluginLoader = () => import("prettier/plugins/typescript");
const postcss: PluginLoader = () => import("prettier/plugins/postcss");
const html: PluginLoader = () => import("prettier/plugins/html");
const markdown: PluginLoader = () => import("prettier/plugins/markdown");
const yaml: PluginLoader = () => import("prettier/plugins/yaml");
const graphql: PluginLoader = () => import("prettier/plugins/graphql");

/** Plugin loaders required by each Prettier parser the app uses. */
const PARSER_PLUGINS: Record<string, PluginLoader[]> = {
  babel: [estree, babel],
  "babel-ts": [estree, typescript],
  typescript: [estree, typescript],
  json: [estree, babel],
  css: [postcss],
  scss: [postcss],
  less: [postcss],
  html: [html],
  vue: [html],
  markdown: [markdown],
  yaml: [yaml],
  graphql: [graphql],
};

/** Whether a Prettier parser is wired up for formatting. */
export const canFormat = (parser: string | undefined): parser is string =>
  parser !== undefined && parser in PARSER_PLUGINS;

/**
 * Format `code` with the given Prettier `parser`, returning the input unchanged
 * if the parser isn't supported. Throws on syntax errors (the caller handles).
 */
export async function formatCode(code: string, parser: string): Promise<string> {
  const loaders = PARSER_PLUGINS[parser];
  if (!loaders) return code;

  const [prettier, ...plugins] = await Promise.all([
    import("prettier/standalone"),
    ...loaders.map((load) => load()),
  ]);

  return prettier.format(code, {
    parser,
    plugins: plugins.map((m) => m.default),
  });
}
