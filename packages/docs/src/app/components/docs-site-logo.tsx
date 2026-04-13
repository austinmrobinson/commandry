import Link from "next/link";
import { Command } from "lucide-react";

import { cn } from "@/app/lib/utils";

/**
 * Fixed mark aligned to the sidebar column — same viewport position on every route
 * (including over the overview demo). Nav scroll area keeps a matching spacer.
 *
 * On the homepage, `visible` is false until the user scrolls past `#overview-demo-strip`
 * (set by `DocsShell`).
 */
export function DocsSiteLogo({ visible = true }: { visible?: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-30 hidden",
        visible ? "min-[980px]:block" : "min-[980px]:hidden"
      )}
      aria-hidden={!visible}
    >
      {/* Match body pt + content-row pt so this lines up with the sticky aside column */}
      <div className="mx-auto flex w-full max-w-[calc(11rem+2rem+36rem)] justify-start px-6 pt-4 sm:pt-6">
        <div className="pointer-events-auto flex w-[11rem] shrink-0 flex-col pt-8 min-[980px]:pt-10">
          <div className="pt-1">
            <Link
              href="/"
              className="inline-flex outline-offset-4"
              aria-label="Commandry home"
            >
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-xl",
                  "bg-[#404040] text-[#ececec]",
                  "shadow-[inset_0_2.5px_0_0_rgba(255,255,255,0.22),inset_0_-2.5px_0_0_#000]",
                  "dark:bg-[#4a4a4a] dark:text-[#f2f2f2]",
                  "dark:shadow-[inset_0_2.5px_0_0_rgba(255,255,255,0.18),inset_0_-2.5px_0_0_#000]"
                )}
                aria-hidden
              >
                <Command
                  className="size-[1.125rem] shrink-0 [filter:drop-shadow(0_-0.5px_1px_rgba(0,0,0,0.42))_drop-shadow(0_0.5px_1px_rgba(255,255,255,0.36))] dark:[filter:drop-shadow(0_-0.5px_1px_rgba(0,0,0,0.5))_drop-shadow(0_0.5px_1px_rgba(255,255,255,0.28))]"
                  strokeWidth={2.25}
                />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
