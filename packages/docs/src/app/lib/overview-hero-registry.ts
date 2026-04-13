import { createCommandry } from "commandry"

/**
 * Matches docs “page” examples; hero commands register under the leaf scope.
 * Demo command definitions: [`heroDemoCommands`](./overview-hero-commands.ts).
 */
export const OVERVIEW_HERO_SCOPE = "overview-hero" as const

/** Sonner `Toaster` id + toast `toasterId` so notifications render inside the overview hero only. */
export const OVERVIEW_HERO_TOASTER_ID = "overview-hero-toasts" as const

export const { registry: overviewHeroRegistry, defineCommands } = createCommandry({
  scopes: {
    page: {
      children: {
        [OVERVIEW_HERO_SCOPE]: {},
      },
    },
  },
})
