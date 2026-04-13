"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DocsFloatingControls } from "@/app/components/docs-floating-controls";
import { DocsPrevNext } from "@/app/components/docs-prev-next";
import { DocsSiteLogo } from "@/app/components/docs-site-logo";
import { OverviewDemoStrip } from "@/app/components/overview-demo-strip";
import { DocsSidebarContent } from "@/app/components/docs-sidebar-content";
import { Sidebar, SidebarProvider } from "@/app/components/ui/sidebar";
import { cn } from "@/app/lib/utils";

const sidebarVars = {
  "--sidebar-width": "11rem",
} as CSSProperties;

/**
 * Agentation-style layout: left nav + 36rem article in one centered row; nav is sticky
 * (see agentation.com/schema — side-nav + .article max-width 36rem).
 */
export function DocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isOverview = pathname === "/";
  /** On `/`, hide the fixed mark until `#overview-demo-strip` has scrolled past the viewport. */
  const [showSiteLogo, setShowSiteLogo] = useState(!isOverview);

  useEffect(() => {
    if (!isOverview) {
      setShowSiteLogo(true);
      return;
    }

    if (!document.getElementById("overview-demo-strip")) {
      setShowSiteLogo(true);
      return;
    }

    function update() {
      const hero = document.getElementById("overview-demo-strip");
      if (!hero) {
        setShowSiteLogo(true);
        return;
      }
      setShowSiteLogo(hero.getBoundingClientRect().bottom <= 0);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isOverview]);

  return (
    <SidebarProvider className="contents" style={sidebarVars}>
      <div
        className={cn(
          /* No overflow-x on this wrapper — it breaks position:sticky on the aside (scroll containment). */
          "docs-site min-h-[100dvh] text-[#111] antialiased dark:text-[#e8e8e8]"
        )}
      >
        <DocsFloatingControls />
        <DocsSiteLogo visible={showSiteLogo} />

        {isOverview ? <OverviewDemoStrip /> : null}

        <div
          className={cn(
            "mx-auto flex w-full max-w-[calc(11rem+2rem+36rem)] items-start gap-8 px-6 pb-16",
            !isOverview && "pt-8 min-[980px]:pt-10"
          )}
        >
          <aside
            className={cn(
              "sticky z-20 hidden w-[11rem] shrink-0 flex-col self-start",
              /* Inset clears fixed `DocsSiteLogo`: full stack on overview (no rail spacer), else stack − spacer */
              isOverview
                ? "min-[980px]:top-[calc(var(--docs-logo-stack)+var(--docs-sidebar-sticky-extra))] max-h-[calc(100dvh-var(--docs-logo-stack)-var(--docs-sidebar-sticky-extra)-0.5rem)]"
                : "min-[980px]:top-[calc(var(--docs-sidebar-sticky-top)+var(--docs-sidebar-sticky-extra))] max-h-[calc(100dvh-var(--docs-sidebar-sticky-top)-var(--docs-sidebar-sticky-extra)-0.5rem)]",
              "overflow-y-auto overflow-x-visible",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "min-[980px]:flex"
            )}
            aria-label="Documentation"
          >
            <Sidebar
              collapsible="none"
              className="border-0 bg-transparent text-[#111] shadow-none dark:text-[#e8e8e8]"
            >
              <DocsSidebarContent />
            </Sidebar>
          </aside>

          <main className="relative min-w-0 flex-1 max-w-[36rem] overflow-x-hidden">
            {children}
            <DocsPrevNext />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
