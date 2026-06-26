import type { LanguageInput } from "shiki";

/**
 * Single source of truth for every language the app supports.
 *
 * Add a language by adding one entry here — the dropdown label, format parser,
 * placeholder sample, and lazy grammar loader are all derived from this list.
 *
 * - `id` must match the grammar's canonical Shiki name (the value passed to
 *   `codeToHtml` as `lang`).
 * - `load` is a dynamic import of the grammar; it is only fetched the first time
 *   the language is highlighted (see `ensureLanguage` in `shiki.ts`).
 * - `prettier` is the Prettier parser name; omit it for highlight-only languages
 *   (the Format button then no-ops). The parser's plugin must be registered in
 *   `Container.tsx`.
 * - `sample` is the placeholder code shown when the language is first selected.
 */
export type LanguageDef = {
  id: string;
  label: string;
  load: () => LanguageInput;
  prettier?: string;
  sample?: string;
};

export const LANGUAGES: LanguageDef[] = [
  {
    id: "typescript",
    label: "TS",
    load: () => import("@shikijs/langs/typescript"),
    prettier: "typescript",
    sample: `const greet = (name: string): string => {
  return \`Hello, \${name}!\`;
};

console.log(greet("world"));`,
  },
  {
    id: "tsx",
    label: "TSX",
    load: () => import("@shikijs/langs/tsx"),
    prettier: "typescript",
    sample: `function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

export default Greeting;`,
  },
  {
    id: "javascript",
    label: "JS",
    load: () => import("@shikijs/langs/javascript"),
    prettier: "babel",
    sample: `const greet = (name) => {
  return \`Hello, \${name}!\`;
};

console.log(greet("world"));`,
  },
  {
    id: "jsx",
    label: "JSX",
    load: () => import("@shikijs/langs/jsx"),
    prettier: "babel",
    sample: `function Greeting({ name }) {
  return <h1 className="title">Hello, {name}!</h1>;
}

export default Greeting;`,
  },
  {
    id: "python",
    label: "PY",
    load: () => import("@shikijs/langs/python"),
    sample: `def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("world"))`,
  },
  {
    id: "go",
    label: "Go",
    load: () => import("@shikijs/langs/go"),
    sample: `package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}`,
  },
  {
    id: "rust",
    label: "Rust",
    load: () => import("@shikijs/langs/rust"),
    sample: `fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}

fn main() {
    println!("{}", greet("world"));
}`,
  },
  {
    id: "java",
    label: "Java",
    load: () => import("@shikijs/langs/java"),
    sample: `public class Main {
    public static void main(String[] args) {
        String name = "world";
        System.out.println("Hello, " + name + "!");
    }
}`,
  },
  {
    id: "c",
    label: "C",
    load: () => import("@shikijs/langs/c"),
    sample: `#include <stdio.h>

int main(void) {
    printf("Hello, %s!\\n", "world");
    return 0;
}`,
  },
  {
    id: "cpp",
    label: "C++",
    load: () => import("@shikijs/langs/cpp"),
    sample: `#include <iostream>

int main() {
    std::string name = "world";
    std::cout << "Hello, " << name << "!\\n";
    return 0;
}`,
  },
  {
    id: "csharp",
    label: "C#",
    load: () => import("@shikijs/langs/csharp"),
    sample: `using System;

class Program {
    static void Main() {
        string name = "world";
        Console.WriteLine($"Hello, {name}!");
    }
}`,
  },
  {
    id: "ruby",
    label: "Ruby",
    load: () => import("@shikijs/langs/ruby"),
    sample: `def greet(name)
  "Hello, #{name}!"
end

puts greet("world")`,
  },
  {
    id: "php",
    label: "PHP",
    load: () => import("@shikijs/langs/php"),
    sample: `<?php

function greet(string $name): string {
    return "Hello, $name!";
}

echo greet("world");`,
  },
  {
    id: "kotlin",
    label: "Kotlin",
    load: () => import("@shikijs/langs/kotlin"),
    sample: `fun greet(name: String): String {
    return "Hello, $name!"
}

fun main() {
    println(greet("world"))
}`,
  },
  {
    id: "swift",
    label: "Swift",
    load: () => import("@shikijs/langs/swift"),
    sample: `func greet(_ name: String) -> String {
    return "Hello, \\(name)!"
}

print(greet("world"))`,
  },
  {
    id: "sql",
    label: "SQL",
    load: () => import("@shikijs/langs/sql"),
    sample: `SELECT id, name, email
FROM users
WHERE active = true
ORDER BY created_at DESC
LIMIT 10;`,
  },
  {
    id: "html",
    label: "HTML",
    load: () => import("@shikijs/langs/html"),
    prettier: "html",
    sample: `<!doctype html>
<html lang="en">
  <head>
    <title>Hello</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>`,
  },
  {
    id: "css",
    label: "CSS",
    load: () => import("@shikijs/langs/css"),
    prettier: "css",
    sample: `.container {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
}`,
  },
  {
    id: "scss",
    label: "SCSS",
    load: () => import("@shikijs/langs/scss"),
    prettier: "scss",
    sample: `$primary: #6c5ce7;

.button {
  color: $primary;

  &:hover {
    color: darken($primary, 10%);
  }
}`,
  },
  {
    id: "vue",
    label: "Vue",
    load: () => import("@shikijs/langs/vue"),
    prettier: "vue",
    sample: `<script setup>
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <button @click="count++">Count: {{ count }}</button>
</template>`,
  },
  {
    id: "svelte",
    label: "Svelte",
    load: () => import("@shikijs/langs/svelte"),
    sample: `<script>
  let count = 0;
</script>

<button on:click={() => count++}>
  Count: {count}
</button>`,
  },
  {
    id: "astro",
    label: "Astro",
    load: () => import("@shikijs/langs/astro"),
    sample: `---
const name = "world";
---

<h1>Hello, {name}!</h1>`,
  },
  {
    id: "markdown",
    label: "MD",
    load: () => import("@shikijs/langs/markdown"),
    prettier: "markdown",
    sample: `# Hello

A **bold** idea with \`inline code\`.

- First item
- Second item

> A blockquote.`,
  },
  {
    id: "graphql",
    label: "GraphQL",
    load: () => import("@shikijs/langs/graphql"),
    prettier: "graphql",
    sample: `type User {
  id: ID!
  name: String!
  posts: [Post!]!
}

query GetUser {
  user(id: "1") {
    name
  }
}`,
  },
  {
    id: "json",
    label: "JSON",
    load: () => import("@shikijs/langs/json"),
    prettier: "json",
    sample: `{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite"
  }
}`,
  },
  {
    id: "yaml",
    label: "YAML",
    load: () => import("@shikijs/langs/yaml"),
    prettier: "yaml",
    sample: `name: my-app
version: 1.0.0
scripts:
  dev: vite
  build: tsc && vite build`,
  },
  {
    id: "toml",
    label: "TOML",
    load: () => import("@shikijs/langs/toml"),
    sample: `[package]
name = "my-app"
version = "1.0.0"

[dependencies]
serde = { version = "1.0", features = ["derive"] }`,
  },
  {
    id: "xml",
    label: "XML",
    load: () => import("@shikijs/langs/xml"),
    sample: `<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>World</to>
  <from>Freaky Shiki</from>
  <body>Hello!</body>
</note>`,
  },
  {
    id: "bash",
    label: "BASH",
    load: () => import("@shikijs/langs/bash"),
    sample: `#!/usr/bin/env bash
set -e

echo "Hello, world!"
ls -la`,
  },
  {
    id: "docker",
    label: "Docker",
    load: () => import("@shikijs/langs/docker"),
    sample: `FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
CMD ["npm", "start"]`,
  },
  {
    id: "diff",
    label: "Diff",
    load: () => import("@shikijs/langs/diff"),
    sample: `--- a/greet.ts
+++ b/greet.ts
@@ -1,3 +1,3 @@
-const greeting = "Hi";
+const greeting = "Hello";
 console.log(greeting);`,
  },
];

/** Dropdown labels, keyed by language id, alphabetized by label for display. */
export const LANG_SHORT: Record<string, string> = Object.fromEntries(
  [...LANGUAGES]
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }))
    .map((l) => [l.id, l.label]),
);

/** Prettier parser per language id, for languages that support formatting. */
export const LANG_PRETTIER: Record<string, string> = Object.fromEntries(
  LANGUAGES.filter((l) => l.prettier).map((l) => [l.id, l.prettier!]),
);

/** Placeholder sample per language id. */
export const LANG_PLACEHOLDER: Record<string, string> = Object.fromEntries(
  LANGUAGES.filter((l) => l.sample).map((l) => [l.id, l.sample!]),
);

/** Lazy grammar loaders per language id, consumed by `ensureLanguage`. */
export const LANG_LOADERS: Record<string, () => LanguageInput> =
  Object.fromEntries(LANGUAGES.map((l) => [l.id, l.load]));
