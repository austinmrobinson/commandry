"use client"

import type { ReactNode } from "react"
import { MousePointerClick } from "lucide-react"
import type { ResolvedCommand, Shortcut, ShortcutField } from "commandry"
import { detectPlatform, displayShortcut, shortcutToParts } from "commandry"

import { cn } from "@/app/lib/utils"

/** Popover / cmdk / menus — readable on `bg-popover` (avoid `text-background`, which matched page bg and hid keys). */
const HERO_MENU_SHORTCUT_KBD_CLASS =
  "pointer-events-none inline-flex size-5 shrink-0 items-center justify-center rounded border border-border bg-muted/80 p-0 font-mono text-[10px] font-medium leading-none text-muted-foreground group-data-[selected=true]/command-item:text-foreground group-data-[variant=destructive]/command-item:border-destructive/35 group-data-[variant=destructive]/command-item:bg-destructive/15 group-data-[variant=destructive]/command-item:text-destructive group-data-[variant=destructive]/command-item:group-data-[selected=true]/command-item:border-destructive/45 group-data-[variant=destructive]/command-item:group-data-[selected=true]/command-item:bg-destructive/20 group-data-[variant=destructive]/command-item:group-data-[selected=true]/command-item:text-destructive group-focus/context-menu-item:text-accent-foreground group-focus/dropdown-menu-item:text-accent-foreground dark:bg-muted/50"

/** Tooltips use `bg-foreground text-background`; keys stay small and legible on that chip. */
const HERO_TOOLTIP_SHORTCUT_KBD_CLASS =
  "pointer-events-none inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-background/35 bg-background/12 p-0 font-mono text-[9px] font-medium leading-none text-background"

export type HeroShortcutDisplaySurface = "menu" | "tooltip"

/** Keycap fill — aligned with `DocsSiteLogo` / Command mark. Inset shadows come from CSS vars + animation. */
const HERO_KEYCAP_SURFACE =
  "bg-[#404040] text-[#ececec] dark:bg-[#4a4a4a] dark:text-[#f2f2f2]"

/** Outer wrapper — centers the key; no fill (key carries surface). */
export const HERO_CORNER_CHIP_CLASS =
  "flex w-full max-w-[min(100%,16rem)] items-center justify-center"

/**
 * Shortcut “key” surface: same bevel as site logo at rest; `heroShortcutKeyPress` swaps to top-only inset shadow when pressed.
 */
/** Square keycap for single modifier/letter flashes (⌘, C, etc.). */
export const HERO_SHORTCUT_KEY_CAP_CLASS = cn(
  "hero-shortcut-keycap inline-flex size-8 shrink-0 items-center justify-center rounded-md p-0 text-center font-mono text-sm font-semibold leading-none tabular-nums",
  HERO_KEYCAP_SURFACE
)

/** Taller keycap row (e.g. ⌘ + pointer) — min square height, width grows with content. */
const HERO_SHORTCUT_KEY_CAP_WIDE_CLASS = cn(
  "hero-shortcut-keycap inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-0.5 rounded-md px-1.5 text-center font-mono text-sm font-semibold leading-none tabular-nums",
  HERO_KEYCAP_SURFACE
)

function heroResolvedShortcut(field: ShortcutField | undefined): Shortcut | null {
  if (!field || field.length === 0) return null
  const first = field[0]
  const isMultiple = Array.isArray(first) && Array.isArray(first[0])
  if (!isMultiple) return field as Shortcut
  return (field as Shortcut[])[0] ?? null
}

/** Parts for the first chord of the hero command’s primary shortcut sequence. */
function heroShortcutChordParts(cmd: ResolvedCommand) {
  const shortcut = heroResolvedShortcut(cmd.shortcut)
  if (!shortcut?.[0]) return []
  const platform = detectPlatform()
  const firstChord: Shortcut = [shortcut[0]]
  return shortcutToParts(firstChord, platform)[0]?.parts ?? []
}

export function shortcutLabelForFlash(field: ShortcutField | undefined): string {
  if (!field || field.length === 0) return ""
  const first = field[0]
  const isMultiple = Array.isArray(first) && Array.isArray(first[0])
  const platform = detectPlatform()
  if (!isMultiple) {
    return displayShortcut(field as Shortcut, platform)
  }
  return displayShortcut((field as Shortcut[])[0], platform)
}

/** Display label for hero command shortcuts (open-in-tab is ⌘/Ctrl + pointer icon, not a letter). */
export function heroCommandShortcutLabel(cmd: ResolvedCommand): string {
  if (cmd.id === "hero.open") {
    return detectPlatform() === "mac" ? "⌘ click" : "Ctrl click"
  }
  return shortcutLabelForFlash(cmd.shortcut)
}

/** Rich shortcut display for menus / tooltips (segmented keycaps when the chord has modifiers + a key). */
export function heroCommandShortcutDisplay(
  cmd: ResolvedCommand,
  options?: { surface?: HeroShortcutDisplaySurface },
): ReactNode {
  const surface = options?.surface ?? "menu"
  const kbdClass =
    surface === "tooltip"
      ? HERO_TOOLTIP_SHORTCUT_KBD_CLASS
      : HERO_MENU_SHORTCUT_KBD_CLASS
  const openIconClass =
    surface === "tooltip" ? "size-3 shrink-0 opacity-90" : "size-4 shrink-0 opacity-90 sm:size-[1.125rem]"

  if (cmd.id === "hero.open") {
    const isMac = detectPlatform() === "mac"
    return (
      <span className="inline-flex items-center gap-0.5">
        <kbd data-slot="kbd" className={kbdClass}>
          {isMac ? "⌘" : "Ctrl"}
        </kbd>
        <MousePointerClick
          aria-hidden
          className={openIconClass}
          strokeWidth={2}
        />
      </span>
    )
  }

  const parts = heroShortcutChordParts(cmd)
  if (parts.length === 0) return null

  if (parts.length === 1) {
    return (
      <kbd data-slot="kbd" className={kbdClass}>
        {parts[0].glyph}
      </kbd>
    )
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      {parts.map((p, i) => (
        <kbd key={i} data-slot="kbd" className={kbdClass}>
          {p.glyph}
        </kbd>
      ))}
    </span>
  )
}

/** Large keycap(s) for the corner flash — matches actual shortcut (e.g. ⌘ + C as two caps). */
export function heroCommandShortcutFlashDisplay(cmd: ResolvedCommand): ReactNode {
  if (cmd.id === "hero.open") {
    const isMac = detectPlatform() === "mac"
    return (
      <div
        className={cn(
          HERO_SHORTCUT_KEY_CAP_WIDE_CLASS,
          "motion-safe:animate-heroShortcutKeyPress"
        )}
      >
        <span aria-hidden className="inline-flex items-center gap-0.5">
          <span>{isMac ? "⌘" : "Ctrl"}</span>
          <MousePointerClick
            aria-hidden
            className="size-3.5 shrink-0 opacity-90 sm:size-4"
            strokeWidth={2}
          />
        </span>
      </div>
    )
  }

  const parts = heroShortcutChordParts(cmd)
  if (parts.length === 0) return null

  if (parts.length === 1) {
    return (
      <div
        className={cn(
          HERO_SHORTCUT_KEY_CAP_CLASS,
          "motion-safe:animate-heroShortcutKeyPress"
        )}
      >
        <span>{parts[0].glyph}</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1">
      {parts.map((p, i) => (
        <div
          key={i}
          className={cn(
            HERO_SHORTCUT_KEY_CAP_CLASS,
            "motion-safe:animate-heroShortcutKeyPress"
          )}
        >
          <span>{p.glyph}</span>
        </div>
      ))}
    </div>
  )
}

export function OverviewHeroShortcutFlash({
  label,
  flashGeneration,
  className,
}: {
  label: ReactNode | null
  /** Increment when a new shortcut fires so the keycap press animation replays. */
  flashGeneration: number
  className?: string
}) {
  if (label == null || label === false) return null

  return (
    <div
      className={cn(
        HERO_CORNER_CHIP_CLASS,
        "pointer-events-none animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none",
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <div key={flashGeneration}>{label}</div>
    </div>
  )
}
