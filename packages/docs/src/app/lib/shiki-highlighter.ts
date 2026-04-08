import { getSingletonHighlighter } from "shiki";
import type { BundledLanguage } from "shiki";

let highlighterPromise: ReturnType<typeof getSingletonHighlighter> | null = null;

async function getHighlighter() {
  highlighterPromise ??= getSingletonHighlighter({
    /* Vitesse separates TS/JS tokens more clearly than GitHub (fewer “everything is blue” collisions). */
    themes: ["vitesse-light", "vitesse-dark"],
    langs: ["tsx", "typescript", "javascript", "bash", "log"],
  });
  return highlighterPromise;
}

export async function highlightCode(code: string, lang: BundledLanguage) {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    themes: {
      light: "vitesse-light",
      dark: "vitesse-dark",
    },
  });
}

/** Server-side: highlighted HTML plus exact source for client copy. */
export async function highlightCodeBlockPayload(code: string, lang: BundledLanguage) {
  const html = await highlightCode(code, lang);
  return { raw: code, html };
}
