"use client"

import { useRef } from "react"

import type { OverviewHeroHandle } from "@/app/components/overview-hero-demo-bridge"
import {
  OverviewHeroDemoBridgeProvider,
  useOverviewHeroDemoBridge,
} from "@/app/components/overview-hero-demo-bridge"
import { OverviewHeroCodePanel } from "@/app/components/overview-hero-code-panel"
import { OverviewHeroSlot } from "@/app/components/overview-hero-slot"
import { cn } from "@/app/lib/utils"

/** ~30% taller than the original 400px cap; keeps a floor on short viewports. */
const DEMO_FIGURE_HEIGHT =
  "h-[min(520px,75dvh)] max-h-[520px] min-h-[364px]"

function OverviewDemoFigure() {
  const { codePanelExpanded } = useOverviewHeroDemoBridge()

  return (
    <figure
      className={cn(
        "grid w-full min-w-0 items-stretch overflow-visible",
        DEMO_FIGURE_HEIGHT,
        codePanelExpanded
          ? "grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]"
          : "grid-cols-1 grid-rows-[minmax(0,1fr)]",
      )}
    >
      <span className="sr-only">
        Demo: Commandry driving a command palette, context menus, and shortcuts from one registry
      </span>
      <OverviewHeroSlot className="relative h-full min-h-0 w-full" />
      {codePanelExpanded ? (
        <div className="min-h-0 h-full min-w-0 w-full">
          <OverviewHeroCodePanel className="h-full min-h-0 w-full" />
        </div>
      ) : null}
    </figure>
  )
}

/** Interactive demo panel — sits in the right column on overview (dotcom preview slot). */
export function OverviewDemoPanel({ className }: { className?: string }) {
  const heroRef = useRef<OverviewHeroHandle | null>(null)

  return (
    <OverviewHeroDemoBridgeProvider heroRef={heroRef}>
      <section
        id="overview-demo-strip"
        className={cn(
          "not-prose relative isolate min-w-0",
          "min-[980px]:flex min-[980px]:h-[calc(100dvh-5rem)] min-[980px]:items-center",
          className,
        )}
        aria-label="Interactive demo"
      >
        <OverviewDemoFigure />
      </section>
    </OverviewHeroDemoBridgeProvider>
  )
}

/** @deprecated Use {@link OverviewDemoPanel} in the overview split layout. */
export function OverviewDemoStrip() {
  return (
    <OverviewDemoPanel
      className={cn(
        "w-full border-b border-border-subtle bg-background",
        "mb-8 min-[980px]:mb-10",
      )}
    />
  )
}
