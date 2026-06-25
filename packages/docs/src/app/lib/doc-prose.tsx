import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

/** Matches dotcom inline link treatment (`app/components/link.tsx`). */
export const docsLinkClassName =
  "relative font-medium text-foreground/80 no-underline transition-colors hover:text-foreground hover:before:bg-overlay-light before:absolute before:-inset-x-1 before:-inset-y-px before:rounded before:transition-all before:duration-300";

export function DocProse({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "docs-article prose prose-sm max-w-none dark:prose-invert",
        "block",
        "prose-headings:font-medium prose-headings:tracking-normal",
        "prose-a:font-medium prose-a:text-foreground/80 prose-a:no-underline hover:prose-a:text-foreground",
        "prose-strong:font-semibold prose-strong:text-foreground/90",
        className
      )}
    >
      {children}
    </article>
  );
}
