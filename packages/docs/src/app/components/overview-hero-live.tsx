"use client"

import dynamic from "next/dynamic"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import { FileText, MoreVertical, PanelRight } from "lucide-react"
import { Toaster } from "sonner"
import {
  buildContextMenuModelFromScope,
  detectPlatform,
  matchesCombo,
  resolveCommandryScopeFromTarget,
} from "commandry"
import type {
  ContextMenuModel,
  KeyCombo,
  ResolvedCommand,
  Shortcut,
} from "commandry"
import {
  CommandryProvider,
  CommandScope,
  useCommandry,
  useCommandSearch,
  useCommands,
  useRegisterCommands,
} from "commandry/react"

import {
  heroDemoCommands,
  type HeroToastTrigger,
} from "@/app/lib/overview-hero-commands"
import {
  OVERVIEW_HERO_SCOPE,
  OVERVIEW_HERO_TOASTER_ID,
  overviewHeroRegistry,
} from "@/app/lib/overview-hero-registry"
import {
  heroCommandShortcutDisplay,
  heroCommandShortcutFlashDisplay,
  heroCommandShortcutLabel,
  OverviewHeroShortcutFlash,
} from "@/app/components/overview-hero-shortcut-flash"
import { Button } from "@/app/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/app/components/ui/command"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/app/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/app/components/ui/item"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip"
import {
  useOptionalOverviewHeroDemoBridge,
  type OverviewHeroHandle,
} from "@/app/components/overview-hero-demo-bridge"
import { cn } from "@/app/lib/utils"

const OverviewHeroHintLayer = dynamic(
  () =>
    import("@/app/components/overview-hero-hint-layer").then((mod) => ({
      default: mod.OverviewHeroHintLayer,
    })),
  { ssr: false },
)

/** Demo list row title — also used as the command palette group label */
const HERO_DEMO_ITEM_TITLE = "Onboarding checklist"

const HERO_DEMO_ITEM_DESCRIPTION = "Product · due Friday · 3 tasks"

/** Match order for hero keyboard shortcuts (first match wins). */
const HERO_SHORTCUT_COMMAND_ORDER = [
  "hero.copy",
  "hero.archive",
  "hero.share",
  "hero.open",
  "hero.rename",
  "hero.delete",
] as const

function heroShortcutFirstCombo(cmd: ResolvedCommand): KeyCombo | null {
  const field = cmd.shortcut
  if (!field?.length) return null
  const first = field[0]
  const isMultiple = Array.isArray(first) && Array.isArray(first[0])
  const shortcut = (isMultiple ? (field as Shortcut[])[0] : field) as Shortcut
  return shortcut[0] ?? null
}

const PRIMARY_IDS = ["hero.copy", "hero.archive"] as const
const OVERFLOW_IDS = [
  "hero.share",
  "hero.open",
  "hero.rename",
  "hero.delete",
] as const

/** Same flat surface for every row; middle row adds hover fill in `className`. */
const HERO_LIST_ITEM_SURFACE =
  "rounded-none border-0 bg-transparent shadow-none ring-0 transition-colors dark:bg-transparent"

/** Icon + title area on decoy rows (1st & 3rd): subtle soften so the middle row reads sharper. */
const HERO_DECOY_CONTENT_LAYER =
  "flex min-w-0 flex-1 items-center gap-3 opacity-60 [filter:blur(0.45px)]"

function HeroStaticListRow() {
  return (
    <div className="pointer-events-none select-none" aria-hidden>
      <Item
        size="sm"
        variant="outline"
        className={HERO_LIST_ITEM_SURFACE}
      >
        <div className={HERO_DECOY_CONTENT_LAYER}>
          <ItemMedia variant="icon">
            <FileText className="text-muted-foreground" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Quarterly review</ItemTitle>
            <ItemDescription>Draft · last week</ItemDescription>
          </ItemContent>
        </div>
        <ItemActions className="opacity-0">
          <Button size="icon-sm" variant="outline" disabled tabIndex={-1}>
            <FileText />
          </Button>
          <Button size="icon-sm" variant="outline" disabled tabIndex={-1}>
            <MoreVertical />
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}

function commandMap(commands: ResolvedCommand[]): Map<string, ResolvedCommand> {
  return new Map(commands.map((c) => [c.id, c]))
}

const PrimaryInlineAction = forwardRef<
  HTMLButtonElement,
  {
    cmd: ResolvedCommand
    onRun: () => void
    onHoverChange?: (hovered: boolean) => void
  }
>(function PrimaryInlineAction({ cmd, onRun, onHoverChange }, ref) {
  const Icon = cmd.icon as ComponentType | undefined
  const shortcutDisplay = heroCommandShortcutDisplay(cmd, { surface: "tooltip" })
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            ref={ref}
            type="button"
            size="icon-sm"
            variant="outline"
            className="transition-transform duration-100 active:scale-95"
            aria-label={cmd.label}
            onClick={onRun}
            onPointerEnter={() => onHoverChange?.(true)}
            onPointerLeave={() => onHoverChange?.(false)}
          />
        }
      >
        {Icon ? <Icon /> : null}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="flex max-w-[min(100vw-2rem,18rem)] items-center gap-2"
      >
        <span className="text-left">{cmd.label}</span>
        {shortcutDisplay ? (
          <span className="shrink-0">{shortcutDisplay}</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  )
})

function ContextMenuActionRow({
  cmd,
  onActivate,
  onHoverChange,
}: {
  cmd: ResolvedCommand
  onActivate: () => void
  onHoverChange?: (hovered: boolean) => void
}) {
  const Icon = cmd.icon as ComponentType<{ className?: string }> | undefined
  const shortcutDisplay = heroCommandShortcutDisplay(cmd)
  return (
    <ContextMenuItem
      disabled={cmd.disabled}
      variant={cmd.danger ? "destructive" : "default"}
      onClick={onActivate}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
    >
      {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      <span className="flex-1 truncate">{cmd.label}</span>
      {shortcutDisplay ? (
        <ContextMenuShortcut className="inline-flex items-center gap-0.5 font-mono">
          {shortcutDisplay}
        </ContextMenuShortcut>
      ) : null}
    </ContextMenuItem>
  )
}

function HeroPaletteCommandItem({
  cmd,
  onSelect,
  onHoverChange,
}: {
  cmd: ResolvedCommand
  onSelect: () => void
  onHoverChange?: (hovered: boolean) => void
}) {
  const Icon = cmd.icon as ComponentType | undefined
  const shortcutDisplay = heroCommandShortcutDisplay(cmd)
  return (
    <CommandItem
      value={`${cmd.label} ${cmd.keywords?.join(" ") ?? ""}`}
      variant={cmd.danger ? "destructive" : "default"}
      onSelect={onSelect}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
    >
      {Icon ? <Icon /> : null}
      <span>{cmd.label}</span>
      {shortcutDisplay ? (
        <CommandShortcut className="inline-flex items-center gap-0.5 font-mono">
          {shortcutDisplay}
        </CommandShortcut>
      ) : null}
    </CommandItem>
  )
}

function HeroContextMenuBody({
  model,
  onCommandActivate,
  onCommandHover,
  collisionBoundary,
}: {
  model: ContextMenuModel | null
  onCommandActivate: (cmd: ResolvedCommand) => void
  onCommandHover?: (cmd: ResolvedCommand | null) => void
  /** Clamp menu to this box; portal stays on `document.body` so `position: fixed` matches Floating UI. */
  collisionBoundary?: HTMLElement | null
}) {
  if (model == null) {
    return null
  }

  const groups = model.groups
  if (model.empty) {
    return (
      <ContextMenuContent
        collisionBoundary={collisionBoundary ?? undefined}
        collisionPadding={8}
        collisionAvoidance={{ side: "flip", align: "shift" }}
        className="min-w-64"
      >
        <p className="px-2 py-3 text-center text-xs text-muted-foreground">
          No actions available
        </p>
      </ContextMenuContent>
    )
  }

  return (
    <ContextMenuContent
      collisionBoundary={collisionBoundary ?? undefined}
      collisionPadding={8}
      collisionAvoidance={{ side: "flip", align: "shift" }}
      className="max-h-[min(360px,var(--available-height))] min-w-64"
    >
      {[...groups.values()].flatMap((items) =>
        items.map((cmd) => (
          <ContextMenuActionRow
            key={cmd.id}
            cmd={cmd}
            onActivate={() => onCommandActivate(cmd)}
            onHoverChange={(h) => onCommandHover?.(h ? cmd : null)}
          />
        )),
      )}
    </ContextMenuContent>
  )
}

const OverviewHeroInner = forwardRef<OverviewHeroHandle>(
  function OverviewHeroInner(_props, ref) {
  const bridge = useOptionalOverviewHeroDemoBridge()
  const { registry } = useCommandry()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [pinnedModel, setPinnedModel] = useState<ContextMenuModel | null>(null)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [shortcutFlashLabel, setShortcutFlashLabel] = useState<ReactNode | null>(
    null,
  )
  const [shortcutFlashGeneration, setShortcutFlashGeneration] = useState(0)
  const shortcutFlashClearRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const registryHoverClearRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const contextMenuRowRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLButtonElement>(null)
  const archiveRef = useRef<HTMLButtonElement>(null)
  const overflowRef = useRef<HTMLButtonElement>(null)
  const toastTriggerRef = useRef<HeroToastTrigger | null>(null)
  const [heroCollisionBoundary, setHeroCollisionBoundary] =
    useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    setHeroCollisionBoundary(containerRef.current)
  }, [])

  const getToastTrigger = useCallback(
    () => toastTriggerRef.current,
    [],
  )

  const commands = useMemo(
    () => heroDemoCommands(getToastTrigger),
    [getToastTrigger],
  )

  useRegisterCommands(commands)

  const scoped = useCommands({ scopes: [OVERVIEW_HERO_SCOPE] })
  const byId = useMemo(() => commandMap(scoped), [scoped])

  const { results, search, setSearch } = useCommandSearch({
    scopes: [OVERVIEW_HERO_SCOPE],
  })

  const paletteRows = useMemo(() => {
    if (!search) return results
    return results.filter((r) => r.scope === OVERVIEW_HERO_SCOPE)
  }, [results, search])

  useEffect(() => {
    if (!paletteOpen) return
    setSearch("")
  }, [paletteOpen, setSearch])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "k") return
      if (!hovering) return
      const el = e.target as HTMLElement | null
      if (el?.closest?.("[data-slot=dialog-content]")) return
      if (el?.closest?.("input, textarea, [contenteditable=true]")) return
      e.preventDefault()
      setPaletteOpen(true)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [hovering])

  const flashShortcutLabel = useCallback((label: ReactNode) => {
    if (shortcutFlashClearRef.current) {
      clearTimeout(shortcutFlashClearRef.current)
    }
    setShortcutFlashGeneration((n) => n + 1)
    setShortcutFlashLabel(label)
    shortcutFlashClearRef.current = setTimeout(() => {
      setShortcutFlashLabel(null)
      shortcutFlashClearRef.current = null
    }, 700)
  }, [])

  useEffect(() => {
    return () => {
      if (shortcutFlashClearRef.current) {
        clearTimeout(shortcutFlashClearRef.current)
        shortcutFlashClearRef.current = null
      }
    }
  }, [])

  const pulseRegistryHover = useCallback(
    (commandId: string) => {
      if (!bridge) return
      if (registryHoverClearRef.current) {
        clearTimeout(registryHoverClearRef.current)
      }
      bridge.setHoveredCommandId(commandId)
      registryHoverClearRef.current = setTimeout(() => {
        bridge.setHoveredCommandId(null)
        registryHoverClearRef.current = null
      }, 700)
    },
    [bridge],
  )

  const run = useCallback(
    (id: string, trigger?: HeroToastTrigger) => {
      if (trigger) {
        bridge?.syncActiveSurfaceFromDemo(trigger)
      }
      toastTriggerRef.current = trigger ?? null
      try {
        void registry.execute(id)
      } finally {
        queueMicrotask(() => {
          toastTriggerRef.current = null
        })
      }
    },
    [bridge, registry],
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!hovering) return
      if (e.repeat) return
      const el = e.target as HTMLElement | null
      if (el?.closest?.("[data-slot=dialog-content]")) return
      if (el?.closest?.("input, textarea, [contenteditable=true]")) return
      if (paletteOpen) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") return

      const platform = detectPlatform()

      for (const id of HERO_SHORTCUT_COMMAND_ORDER) {
        const cmd = byId.get(id)
        if (!cmd || cmd.disabled) continue
        const combo = heroShortcutFirstCombo(cmd)
        if (!combo || !matchesCombo(e, combo, platform)) continue

        e.preventDefault()
        run(id, "shortcut")
        pulseRegistryHover(id)
        flashShortcutLabel(
          cmd.id === "hero.open" ? (
            <>
              <span className="sr-only">{heroCommandShortcutLabel(cmd)}</span>
              {heroCommandShortcutFlashDisplay(cmd)}
            </>
          ) : (
            heroCommandShortcutFlashDisplay(cmd)
          ),
        )
        return
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [
    hovering,
    paletteOpen,
    byId,
    run,
    flashShortcutLabel,
    pulseRegistryHover,
  ])

  useImperativeHandle(
    ref,
    (): OverviewHeroHandle => ({
      demoSurface(trigger) {
        switch (trigger) {
          case "cmdk":
            setPaletteOpen(true)
            break
          case "context-menu": {
            const el = contextMenuRowRef.current
            if (!el) break
            const r = el.getBoundingClientRect()
            el.dispatchEvent(
              new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: Math.floor(r.left + r.width / 2),
                clientY: Math.floor(r.top + r.height / 2),
                view: window,
              }),
            )
            break
          }
          case "shortcut": {
            const cmd = byId.get("hero.copy")
            if (cmd) {
              flashShortcutLabel(heroCommandShortcutFlashDisplay(cmd))
              pulseRegistryHover("hero.copy")
            }
            break
          }
          case "toolbar":
            copyRef.current?.focus()
            break
          case "dropdown":
            setDropdownOpen(true)
            break
          default:
            break
        }
      },
    }),
    [byId, flashShortcutLabel, pulseRegistryHover],
  )

  const handleContextMenuCapture = useCallback(
    (e: React.MouseEvent) => {
      const { scope } = resolveCommandryScopeFromTarget(e.target)
      const snapshot = registry.getCommands()
      setPinnedModel(
        buildContextMenuModelFromScope({
          commands: snapshot,
          menuScope: scope,
          scopeTree: registry.scopeTree,
        }),
      )
      setContextMenuOpen(true)
    },
    [registry],
  )

  const handleContextOpenChange = useCallback((open: boolean) => {
    setContextMenuOpen(open)
    if (!open) setPinnedModel(null)
  }, [])

  const rowHighlightClass = cn(
    "transition-colors duration-200",
    "focus-within:bg-muted/55 dark:focus-within:bg-muted/40",
    contextMenuOpen && "bg-muted/60 dark:bg-muted/45",
  )

  return (
    <div
      ref={containerRef}
      className="relative isolate flex min-h-0 w-full flex-1 flex-col overflow-visible bg-muted/55 p-4 sm:p-6"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <div className="pointer-events-none absolute bottom-2 left-2 z-[45] flex max-w-[min(calc(100%-1rem),16rem)] flex-col items-start gap-1.5">
        <OverviewHeroShortcutFlash
          label={shortcutFlashLabel}
          flashGeneration={shortcutFlashGeneration}
        />
      </div>

      {bridge ? (
        <div className="pointer-events-auto absolute top-2 right-2 z-[46]">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "rounded-[min(var(--radius-md),10px)]",
                    bridge.codePanelExpanded &&
                      "border border-border bg-muted-foreground/20 text-foreground dark:bg-muted-foreground/35",
                  )}
                  aria-expanded={bridge.codePanelExpanded}
                  aria-controls="overview-hero-code-panel"
                  aria-label={
                    bridge.codePanelExpanded
                      ? "Hide code panel"
                      : "Show code panel"
                  }
                  onClick={() => bridge.toggleCodePanel()}
                />
              }
            >
              <PanelRight className="size-3" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={6}>
              {bridge.codePanelExpanded ? "Hide code panel" : "Show code panel"}
            </TooltipContent>
          </Tooltip>
        </div>
      ) : null}

      <p className="sr-only">
        Interactive sample: use the item actions, the overflow menu, right-click the row,
        or press Command-K while hovering to open the command palette.
      </p>

      <div className="relative flex min-h-0 flex-1 flex-col justify-center gap-2">
        <ContextMenu
          open={contextMenuOpen}
          onOpenChange={handleContextOpenChange}
        >
          <ContextMenuTrigger
            className="relative mx-auto block w-full max-w-[360px] outline-none"
            onContextMenuCapture={handleContextMenuCapture}
          >
            <div className="relative">
              <div className="relative z-0 overflow-hidden rounded-lg border border-border bg-card/95 dark:bg-card/55">
                <div className="flex flex-col divide-y divide-border">
                  <HeroStaticListRow />

                  <div
                    ref={contextMenuRowRef}
                    className={cn("relative", rowHighlightClass)}
                  >
                    <Item
                      size="sm"
                      variant="outline"
                      className={cn(
                        HERO_LIST_ITEM_SURFACE,
                        "hover:bg-muted/55 dark:hover:bg-muted/40",
                      )}
                    >
                    <ItemMedia variant="icon">
                      <FileText />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{HERO_DEMO_ITEM_TITLE}</ItemTitle>
                      <ItemDescription>{HERO_DEMO_ITEM_DESCRIPTION}</ItemDescription>
                    </ItemContent>
                    <ItemActions
                      className={
                        dropdownOpen || contextMenuOpen ? "opacity-100" : undefined
                      }
                    >
                      {PRIMARY_IDS.map((id) => {
                        const cmd = byId.get(id)
                        if (!cmd) return null
                        const ref =
                          id === "hero.copy" ? copyRef : archiveRef
                        return (
                          <PrimaryInlineAction
                            key={id}
                            ref={ref}
                            cmd={cmd}
                            onRun={() => run(id, "toolbar")}
                            onHoverChange={(h) =>
                              bridge?.setHoveredCommandId(h ? id : null)
                            }
                          />
                        )
                      })}
                      <DropdownMenu
                        open={dropdownOpen}
                        onOpenChange={setDropdownOpen}
                      >
                        <DropdownMenuTrigger
                          render={
                            <Button
                              ref={overflowRef}
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              className="transition-transform duration-100 active:scale-95"
                              aria-label="More actions"
                            />
                          }
                        >
                          <MoreVertical />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-64">
                          {OVERFLOW_IDS.map((id) => {
                            const cmd = byId.get(id)
                            if (!cmd) return null
                            const Icon = cmd.icon
                            const isDelete = id === "hero.delete"
                            const shortcutDisplay = heroCommandShortcutDisplay(cmd)
                            return (
                              <DropdownMenuItem
                                key={id}
                                variant={isDelete ? "destructive" : "default"}
                                onClick={() => run(id, "dropdown")}
                                onPointerEnter={() =>
                                  bridge?.setHoveredCommandId(id)
                                }
                                onPointerLeave={() =>
                                  bridge?.setHoveredCommandId(null)
                                }
                              >
                                {Icon ? <Icon /> : null}
                                <span className="flex-1 truncate">
                                  {cmd.label}
                                </span>
                                {shortcutDisplay ? (
                                  <DropdownMenuShortcut className="inline-flex shrink-0 items-center gap-0.5 font-mono">
                                    {shortcutDisplay}
                                  </DropdownMenuShortcut>
                                ) : null}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </ItemActions>
                  </Item>
                </div>

                <HeroStaticListRow />
              </div>
              </div>
              <OverviewHeroHintLayer />
            </div>
          </ContextMenuTrigger>
          <HeroContextMenuBody
            model={pinnedModel}
            collisionBoundary={heroCollisionBoundary}
            onCommandActivate={(cmd) => run(cmd.id, "context-menu")}
            onCommandHover={(cmd) =>
              bridge?.setHoveredCommandId(cmd?.id ?? null)
            }
          />
        </ContextMenu>

        <CommandDialog
          container={containerRef}
          modal="trap-focus"
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          title="Commands"
          description="Run an action from the overview hero scope"
        >
          <Command shouldFilter={false} loop>
            <CommandInput
              placeholder="Search commands…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No commands found.</CommandEmpty>
              <CommandGroup heading={HERO_DEMO_ITEM_TITLE}>
                {paletteRows.map((cmd) => (
                  <HeroPaletteCommandItem
                    key={cmd.id}
                    cmd={cmd}
                    onSelect={() => {
                      run(cmd.id, "cmdk")
                      setPaletteOpen(false)
                    }}
                    onHoverChange={(h) =>
                      bridge?.setHoveredCommandId(h ? cmd.id : null)
                    }
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </div>

      <div className="overview-hero-toast-host pointer-events-none absolute inset-0 z-[60]">
        <Toaster
          id={OVERVIEW_HERO_TOASTER_ID}
          closeButton={false}
          duration={1800}
          position="bottom-center"
          theme="system"
          className="pointer-events-auto"
          toastOptions={{
            duration: 1800,
            classNames: {
              toast:
                "!mx-auto !flex !w-max !max-w-[min(280px,calc(100%-2rem))] !min-w-0 !items-center !justify-center !gap-0 !rounded-md !border-0 !bg-foreground !px-3 !py-1.5 !text-center !font-sans !text-xs !text-background !shadow-none",
              title:
                "!text-center !text-xs !leading-snug !text-background",
              description: "!hidden",
            },
          }}
        />
      </div>
    </div>
  )
})

export const OverviewHeroLive = forwardRef<
  OverviewHeroHandle,
  { className?: string }
>(function OverviewHeroLive({ className }, ref) {
  return (
    <CommandryProvider registry={overviewHeroRegistry} shortcuts={false}>
      <CommandScope
        asChild
        scope={OVERVIEW_HERO_SCOPE}
        ctx={{}}
        activateOn="mount"
        className={cn(
          "flex h-full min-h-0 min-w-0 flex-1 flex-col self-stretch",
          className,
        )}
      >
        <div>
          <OverviewHeroInner ref={ref} />
        </div>
      </CommandScope>
    </CommandryProvider>
  )
})
