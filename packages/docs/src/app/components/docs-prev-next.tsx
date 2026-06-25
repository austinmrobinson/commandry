"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { getDocNeighbors } from "@/app/lib/docs-nav";
import { cn } from "@/app/lib/utils";

const cardClass =
  "group flex flex-col gap-1 rounded-lg border border-border bg-overlay-subtle px-3 py-3 transition-[border-color,background-color] hover:border-border-medium hover:bg-overlay-light";

export function DocsPrevNext() {
  const pathname = usePathname();
  const { prev, next } = getDocNeighbors(pathname);

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Adjacent pages"
      className="not-prose mt-14 border-t border-border-subtle pt-8 sm:mt-16"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={prev.href}
            prefetch
            className={cn(cardClass, "items-start text-left")}
          >
            <span className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-text-tertiary">
              <ArrowLeft className="size-3.5 shrink-0 opacity-70" aria-hidden />
              Previous
            </span>
            <span className="text-base font-medium text-foreground">
              {prev.title}
            </span>
          </Link>
        ) : null}

        {next ? (
          <Link
            href={next.href}
            prefetch
            className={cn(
              cardClass,
              "items-end text-right",
              !prev && "sm:col-start-2"
            )}
          >
            <span className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-text-tertiary">
              Next
              <ArrowRight className="size-3.5 shrink-0 opacity-70" aria-hidden />
            </span>
            <span className="text-base font-medium text-foreground">
              {next.title}
            </span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
