"use client"

import dynamic from "next/dynamic"
import { forwardRef } from "react"

import type { OverviewHeroHandle } from "@/app/components/overview-hero-demo-bridge"
import { cn } from "@/app/lib/utils"

const OverviewHeroLiveDynamic = dynamic(
  () =>
    import("@/app/components/overview-hero-live").then((m) => ({
      default: m.OverviewHeroLive,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="absolute inset-0 animate-pulse bg-black/[0.03] dark:bg-white/[0.04]"
        aria-hidden
      />
    ),
  }
)

export const OverviewHeroSlot = forwardRef<
  OverviewHeroHandle,
  { className?: string }
>(function OverviewHeroSlot({ className }, ref) {
  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col">
      <OverviewHeroLiveDynamic
        ref={ref}
        className={cn("min-h-0 flex-1", className)}
      />
    </div>
  )
})
