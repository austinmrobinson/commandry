import type { BundledLanguage } from "shiki";
import { DocsCodeBlockChrome } from "@/app/components/docs-code-block-chrome";
import { highlightCodeBlockPayload } from "@/app/lib/shiki-highlighter";

interface CodeBlockProps {
  /** Raw source string (use template literals). */
  children: string;
  title?: string;
  className?: string;
  /** Shiki language id; defaults to TSX for most docs snippets. */
  language?: BundledLanguage;
}

export async function CodeBlock({
  children,
  title,
  className,
  language = "tsx",
}: CodeBlockProps) {
  const { raw, html } = await highlightCodeBlockPayload(children, language);

  return (
    <DocsCodeBlockChrome
      variant="single"
      raw={raw}
      html={html}
      title={title}
      className={className}
    />
  );
}
