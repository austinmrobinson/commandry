"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DocsFloatingControls } from "@/app/components/docs-floating-controls";
import { DocsMarginNav } from "@/app/components/docs-margin-nav";
import { DocsPrevNext } from "@/app/components/docs-prev-next";
import { OverviewDemoPanel } from "@/app/components/overview-demo-strip";
import {
  DOCS_ARTICLE_WIDTH,
  DOCS_LAYOUT_MAX,
  DOCS_LEFT_CLUSTER_WIDTH,
  DOCS_MARGIN_NAV_GAP,
  DOCS_PAGE_PADDING,
  DOCS_SPLIT_ROW,
} from "@/app/lib/docs-layout";
import { cn } from "@/app/lib/utils";

function DocsArticleColumn({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start",
        DOCS_LEFT_CLUSTER_WIDTH,
        DOCS_MARGIN_NAV_GAP,
      )}
    >
      <DocsMarginNav />
      <main className={cn("relative min-w-0 overflow-x-hidden", DOCS_ARTICLE_WIDTH)}>
        {children}
        <DocsPrevNext />
      </main>
    </div>
  );
}

/**
 * Dotcom-style overview: fixed 480px article on the left, live demo on the right.
 * Full-width row with page padding — no centered max-width container.
 */
export function DocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isOverview = pathname === "/";

  return (
    <div className="docs-site min-h-[100dvh] w-full text-foreground antialiased">
      <DocsFloatingControls />

      {isOverview ? (
        <div className={cn("w-full", DOCS_PAGE_PADDING)}>
          <div className={DOCS_SPLIT_ROW}>
            <div className="order-2 min-w-0 min-[980px]:order-1">
              <DocsArticleColumn>{children}</DocsArticleColumn>
            </div>

            <OverviewDemoPanel
              className={cn(
                "order-1 min-w-0 flex-1 min-[980px]:order-2",
                "min-[980px]:sticky min-[980px]:top-10",
              )}
            />
          </div>
        </div>
      ) : (
        <div className={cn(DOCS_LAYOUT_MAX, "w-full", DOCS_PAGE_PADDING)}>
          <DocsArticleColumn>{children}</DocsArticleColumn>
        </div>
      )}
    </div>
  );
}
