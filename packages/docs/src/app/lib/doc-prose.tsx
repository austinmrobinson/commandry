import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

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
        "docs-article prose max-w-none dark:prose-invert",
        "flex flex-col gap-2.5",
        "prose-headings:font-normal",
        "prose-a:font-[450] prose-a:text-[#2480ed] prose-a:no-underline hover:prose-a:text-[#74b1fd]",
        "dark:prose-a:text-sky-400 dark:hover:prose-a:text-sky-300",
        "prose-strong:font-semibold prose-strong:text-foreground/90",
        className
      )}
    >
      {children}
    </article>
  );
}
