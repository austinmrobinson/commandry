import type { Element } from "hast"
import type { BundledLanguage } from "shiki"
import type { Highlighter } from "shiki"

let highlighterPromise: Promise<Highlighter> | null = null

async function getClientHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= import("shiki").then(({ getSingletonHighlighter }) =>
    getSingletonHighlighter({
      themes: ["vitesse-light", "vitesse-dark"],
      langs: ["tsx"],
    }),
  )
  return highlighterPromise
}

/** Matches rehype-pretty-code / shadcn taxonomy: each line is a span with `data-line` for CSS highlights. */
const overviewHeroRegistryDataLineTransformer = {
  name: "overview-hero-registry-data-line",
  line(element: Element, line: number) {
    element.properties = element.properties ?? {}
    element.properties["data-line"] = line
    return element
  },
}

export async function highlightOverviewHeroCode(
  code: string,
  options: { lang?: BundledLanguage; theme: "vitesse-light" | "vitesse-dark" },
) {
  const highlighter = await getClientHighlighter()
  const lang = options.lang ?? "tsx"
  return highlighter.codeToHtml(code, {
    lang,
    theme: options.theme,
  })
}

export async function highlightOverviewHeroRegistryCode(
  code: string,
  theme: "vitesse-light" | "vitesse-dark",
) {
  const highlighter = await getClientHighlighter()
  return highlighter.codeToHtml(code, {
    lang: "tsx",
    theme,
    structure: "classic",
    transformers: [overviewHeroRegistryDataLineTransformer],
  })
}
