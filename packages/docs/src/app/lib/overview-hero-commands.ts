import {
  Archive,
  Copy,
  ExternalLink,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react"
import { createElement } from "react"
import { toast } from "sonner"
import { HeroShortcutToastLabel } from "@/app/components/overview-hero-shortcut-toast-label"
import {
  defineCommands,
  OVERVIEW_HERO_TOASTER_ID,
} from "@/app/lib/overview-hero-registry"

const DEMO_URL = "https://github.com/austinmrobinson/commandry"

/**
 * Priorities encode **demo surface order** (toolbar → overflow → palette → context menu).
 * `CommandRegistry.getCommands` sorts by group (omitted here), then descending priority, then
 * label — keep these in sync with `PRIMARY_IDS` / `OVERFLOW_IDS` in `overview-hero-live.tsx`.
 */
const DEMO_ORDER_PRIORITY = {
  copy: 60,
  archive: 50,
  share: 40,
  open: 30,
  rename: 20,
  delete: 10,
} as const

/** How the hero command was invoked (drives demo toasts for every surface). */
export type HeroToastTrigger =
  | "context-menu"
  | "cmdk"
  | "shortcut"
  | "toolbar"
  | "dropdown"

const heroToastBase = {
  toasterId: OVERVIEW_HERO_TOASTER_ID,
  icon: null,
  duration: 1800,
} as const

/** Same command fired repeatedly → one toast updates; count badge in `HeroShortcutToastLabel` (Sonner `id` dedupes). */
const heroActionBurstById = new Map<
  string,
  { count: number; resetTimer: ReturnType<typeof setTimeout> | null }
>()
let lastHeroActionBurstCommandId: string | null = null

const HERO_ACTION_BURST_IDLE_MS = 2200

function toastHeroActionBurst(commandId: string, label: string) {
  if (lastHeroActionBurstCommandId !== commandId) {
    heroActionBurstById.clear()
    lastHeroActionBurstCommandId = commandId
  }

  let entry = heroActionBurstById.get(commandId)
  if (!entry) {
    entry = { count: 0, resetTimer: null }
    heroActionBurstById.set(commandId, entry)
  }
  if (entry.resetTimer) clearTimeout(entry.resetTimer)
  entry.count += 1
  entry.resetTimer = setTimeout(() => {
    heroActionBurstById.delete(commandId)
    lastHeroActionBurstCommandId = null
  }, HERO_ACTION_BURST_IDLE_MS)

  toast.message(
    createElement(HeroShortcutToastLabel, {
      label,
      count: entry.count,
    }),
    {
      ...heroToastBase,
      id: `overview-hero-action:${commandId}`,
    },
  )
}

/**
 * Command definitions for the overview hero demo.
 * `getToastTrigger` should return how the current execution was triggered (set by the caller
 * around `registry.execute`).
 */
export function heroDemoCommands(getToastTrigger: () => HeroToastTrigger | null) {
  return defineCommands({
    "hero.copy": {
      label: "Copy link",
      icon: Copy,
      priority: DEMO_ORDER_PRIORITY.copy,
      keywords: ["copy", "clipboard", "link"],
      shortcut: [["mod", "c"]],
      handler: async () => {
        const trigger = getToastTrigger()
        try {
          await navigator.clipboard.writeText(DEMO_URL)
        } catch {
          /* ignore */
        }
        if (trigger) {
          toastHeroActionBurst("hero.copy", "Copy link")
        }
      },
    },
    "hero.archive": {
      label: "Archive",
      icon: Archive,
      priority: DEMO_ORDER_PRIORITY.archive,
      keywords: ["archive", "hide"],
      shortcut: [["e"]],
      handler: async () => {
        const trigger = getToastTrigger()
        if (trigger) {
          toastHeroActionBurst("hero.archive", "Archive")
        }
      },
    },
    "hero.share": {
      label: "Share…",
      icon: Share2,
      priority: DEMO_ORDER_PRIORITY.share,
      keywords: ["share", "send"],
      shortcut: [["s"]],
      handler: async () => {
        const trigger = getToastTrigger()
        if (trigger) {
          toastHeroActionBurst("hero.share", "Share…")
        }
      },
    },
    "hero.open": {
      label: "Open in new tab",
      icon: ExternalLink,
      priority: DEMO_ORDER_PRIORITY.open,
      keywords: ["open", "tab", "external"],
      shortcut: [["o"]],
      handler: async () => {
        const trigger = getToastTrigger()
        window.open(DEMO_URL, "_blank", "noopener,noreferrer")
        if (trigger) {
          toastHeroActionBurst("hero.open", "Open in new tab")
        }
      },
    },
    "hero.rename": {
      label: "Rename",
      icon: Pencil,
      priority: DEMO_ORDER_PRIORITY.rename,
      keywords: ["rename", "edit", "title"],
      shortcut: [["r"]],
      handler: async () => {
        const trigger = getToastTrigger()
        if (trigger) {
          toastHeroActionBurst("hero.rename", "Rename")
        }
      },
    },
    "hero.delete": {
      label: "Delete",
      icon: Trash2,
      priority: DEMO_ORDER_PRIORITY.delete,
      danger: true,
      keywords: ["delete", "remove", "trash", "x"],
      shortcut: [["x"]],
      handler: async () => {
        const trigger = getToastTrigger()
        if (trigger) {
          toastHeroActionBurst("hero.delete", "Delete")
        }
      },
    },
  })
}
