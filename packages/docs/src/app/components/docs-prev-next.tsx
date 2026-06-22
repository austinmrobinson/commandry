"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { getDocNeighbors } from "@/app/lib/docs-nav";
import { cn } from "@/app/lib/utils";

const cardClass =
  "group flex flex-col gap-1 rounded-lg border border-black/[0.08] bg-black/[0.02] px-3 py-3 transition-[border-color,background-color] dark:border-white/10 dark:bg-white/[0.03] " +
  "hover:border-black/[0.12] hover:bg-black/[0.04] dark:hover:border-white/14 dark:hover:bg-white/[0.05]";

export function DocsPrevNext() {
  const pathname = usePathname();
  const { prev, next } = getDocNeighbors(pathname);

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Adjacent pages"
      className="not-prose mt-12 border-t border-black/[0.06] pt-8 dark:border-white/10"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={prev.href}
            prefetch
            className={cn(cardClass, "items-start text-left")}
          >
            <span className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-black/45 dark:text-white/45">
              <ArrowLeft className="size-3.5 shrink-0 opacity-70" aria-hidden />
              Previous
            </span>
            <span className="text-base font-[500] text-[#111] dark:text-[#e8e8e8]">
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
            <span className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-black/45 dark:text-white/45">
              Next
              <ArrowRight className="size-3.5 shrink-0 opacity-70" aria-hidden />
            </span>
            <span className="text-base font-[500] text-[#111] dark:text-[#e8e8e8]">
              {next.title}
            </span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
