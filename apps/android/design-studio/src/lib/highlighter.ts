import { createHighlighterCore, type HighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

import bash from "@shikijs/langs/bash"
import css from "@shikijs/langs/css"
import html from "@shikijs/langs/html"
import javascript from "@shikijs/langs/javascript"
import json from "@shikijs/langs/json"
import jsx from "@shikijs/langs/jsx"
import markdown from "@shikijs/langs/markdown"
import python from "@shikijs/langs/python"
import sql from "@shikijs/langs/sql"
import tsLang from "@shikijs/langs/ts"
import tsx from "@shikijs/langs/tsx"
import yaml from "@shikijs/langs/yaml"

import dracula from "@shikijs/themes/dracula"
import githubDark from "@shikijs/themes/github-dark"
import githubLight from "@shikijs/themes/github-light"
import nord from "@shikijs/themes/nord"
import oneDarkPro from "@shikijs/themes/one-dark-pro"

let highlighterPromise: Promise<HighlighterCore> | null = null

// Fine-grained core build (only the langs/themes this app actually offers,
// pure-JS regex engine instead of the oniguruma WASM) instead of `shiki`'s
// default full bundle — that one code-splits every language shiki knows
// about into the build output, most of which we never load.
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubDark, githubLight, dracula, nord, oneDarkPro],
      langs: [
        tsLang,
        tsx,
        javascript,
        jsx,
        json,
        bash,
        css,
        html,
        python,
        sql,
        yaml,
        markdown,
      ],
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighterPromise
}

export async function highlightCode(
  code: string,
  lang: string,
  theme: string
): Promise<string> {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, { lang, theme })
}
