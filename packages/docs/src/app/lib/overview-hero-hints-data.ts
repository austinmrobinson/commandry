import type { ComponentType, SVGProps } from "react"

import {
  HeroHintArrowCmdK,
  HeroHintArrowRightClick,
  HeroHintArrowToolbar,
} from "@/app/components/overview-hero-hint-arrows"

export interface HeroHintConfig {
  id: string
  text: string
  top: number
  bottom: number
  left: number
  right: number
  arrowScale: number
  labelOffsetX: number
  labelOffsetY: number
  flipHoriz: boolean
  Arrow: ComponentType<SVGProps<SVGSVGElement>>
}

/** Tuned layout defaults (no Leva). */
export const OVERVIEW_HERO_HINTS: readonly HeroHintConfig[] = [
  {
    id: "right-click",
    text: "Right-click me",
    top: -63,
    bottom: 0,
    left: -97,
    right: 0,
    arrowScale: 1,
    labelOffsetX: -24,
    labelOffsetY: -5,
    flipHoriz: true,
    Arrow: HeroHintArrowRightClick,
  },
  {
    id: "cmd-k",
    text: "⌘K me",
    top: 45,
    bottom: 0,
    left: 0,
    right: -131,
    arrowScale: 0.5,
    labelOffsetX: -32,
    labelOffsetY: 0,
    flipHoriz: false,
    Arrow: HeroHintArrowCmdK,
  },
  {
    id: "toolbar",
    text: "Push my buttons",
    top: -34,
    bottom: 0,
    left: 0,
    right: 34,
    arrowScale: 0.8,
    labelOffsetX: 17,
    labelOffsetY: 2,
    flipHoriz: true,
    Arrow: HeroHintArrowToolbar,
  },
] as const

/** Time the hint stays fully visible after the enter animation finishes. */
export const HINT_SHOW_MS = 5000
/** Pause after a hint finishes exiting before the next hint enters. */
export const HINT_GAP_MS = 5000
