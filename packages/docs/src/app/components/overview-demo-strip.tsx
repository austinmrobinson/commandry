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

function OverviewDemoStripFigure() {
  const { codePanelExpanded } = useOverviewHeroDemoBridge()

  return (
    <figure
      className={cn(
        "grid h-[400px] max-h-[400px] min-h-0 w-full items-stretch overflow-visible",
        codePanelExpanded
          ? "grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] min-[980px]:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] min-[980px]:grid-rows-[minmax(0,1fr)]"
          : "grid-cols-1 grid-rows-[minmax(0,1fr)]",
      )}
    >
      <span className="sr-only">
        Demo: Commandry driving a command palette, context menus, and shortcuts from one registry
      </span>
      <OverviewHeroSlot className="relative h-full min-h-0 w-full" />
      {codePanelExpanded ? (
        <div
          className={cn(
            "min-h-0 h-full w-full",
            /* 4px inset on wide layout: mat shows through so the code panel reads as a tile. */
            "min-[980px]:box-border min-[980px]:bg-muted/45 min-[980px]:pb-1 min-[980px]:pr-1",
          )}
        >
          <OverviewHeroCodePanel className="h-full min-h-0 w-full" />
        </div>
      ) : null}
    </figure>
  )
}

/** Full-width strip above the docs two-column layout (overview only). */
export function OverviewDemoStrip() {
  const heroRef = useRef<OverviewHeroHandle | null>(null)

  return (
    <OverviewHeroDemoBridgeProvider heroRef={heroRef}>
      <section
        id="overview-demo-strip"
        className={cn(
          "not-prose relative isolate -mt-4 w-full border-b border-black/[0.06] bg-background pt-0 sm:-mt-6 dark:border-white/10 dark:bg-background",
          "mb-8 min-[980px]:mb-10"
        )}
        aria-label="Interactive demo"
      >
        <OverviewDemoStripFigure />
      </section>
    </OverviewHeroDemoBridgeProvider>
  )
}
