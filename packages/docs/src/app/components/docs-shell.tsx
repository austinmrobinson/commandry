"use client";

import type { CSSProperties, ReactNode } from "react";
import { DocsFloatingControls } from "@/app/components/docs-floating-controls";
import { DocsSidebarContent } from "@/app/components/docs-sidebar-content";
import { Sidebar, SidebarProvider } from "@/app/components/ui/sidebar";
import { cn } from "@/app/lib/utils";

const sidebarVars = {
  "--sidebar-width": "11rem",
} as CSSProperties;

/**
 * Agentation-style layout: fixed left nav aligned to a centered 36rem article
 * (see agentation.com/schema — side-nav + .article max-width 36rem).
 */
export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="contents" style={sidebarVars}>
      <div className={cn("docs-site min-h-[100dvh] text-[#111] antialiased dark:text-[#e8e8e8]")}>
        <DocsFloatingControls />

        {/* Fixed nav — matches agentation .side-nav placement */}
        <aside
          className={cn(
            "fixed bottom-6 z-30 hidden w-[11rem] flex-col overflow-y-auto overflow-x-visible",
            "top-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "min-[980px]:flex",
            "left-[max(1rem,calc(50%-18rem-11rem))]"
          )}
          aria-label="Documentation"
        >
          <Sidebar
            collapsible="none"
            className="h-full border-0 bg-transparent text-[#111] shadow-none dark:text-[#e8e8e8]"
          >
            <DocsSidebarContent />
          </Sidebar>
        </aside>

        {/* Centered article column */}
        <main
          className={cn(
            "relative mx-auto w-full max-w-[36rem] px-6 pb-16 pt-8",
            "min-[980px]:px-6 min-[980px]:pt-10"
          )}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
