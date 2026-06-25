import { createRegistry } from "commandry"

/**
 * Matches docs “page” examples; hero commands register under the leaf region.
 * Demo command definitions: [`heroDemoCommands`](./overview-hero-commands.ts).
 */
export const OVERVIEW_HERO_REGION = "overview-hero" as const

/** @deprecated Use {@link OVERVIEW_HERO_REGION} */
export const OVERVIEW_HERO_SCOPE = OVERVIEW_HERO_REGION

/** Sonner `Toaster` id + toast `toasterId` so notifications render inside the overview hero only. */
export const OVERVIEW_HERO_TOASTER_ID = "overview-hero-toasts" as const

export const overviewHeroRegistry = createRegistry()
