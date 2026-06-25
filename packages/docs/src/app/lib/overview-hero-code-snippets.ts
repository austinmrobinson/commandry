/**
 * Display strings for the overview hero code panel. Keep in sync with
 * `overview-hero-commands.ts` and the excerpts in `overview-hero-live.tsx`.
 *
 * Registry snippet `priority` values mirror `DEMO_ORDER_PRIORITY` there: higher = earlier in
 * `getCommands()` / palette order (same sequence as the demo toolbar + overflow).
 */
import type { HeroToastTrigger } from "@/app/lib/overview-hero-commands"

/** First tab is the unified registry; remainder are surface wiring snippets. */
export type OverviewHeroPanelTab = "commands" | HeroToastTrigger

/** One Shiki-highlighted block per command id for registry hover sync. */
export const OVERVIEW_HERO_REGISTRY_BLOCKS: { id: string; code: string }[] = [
  {
    id: "hero.copy",
    code: `    "copy": {
      label: "Copy link",
      icon: Copy,
      priority: 60,
      keywords: ["copy", "clipboard", "link"],
      shortcut: [["mod", "c"]],
      handler: async () => {
        /* … */
      },
    },`,
  },
  {
    id: "hero.archive",
    code: `    "archive": {
      label: "Archive",
      icon: Archive,
      priority: 50,
      keywords: ["archive", "hide"],
      shortcut: [["e"]],
      handler: async () => {
        /* … */
      },
    },`,
  },
  {
    id: "hero.share",
    code: `    "share": {
      label: "Share…",
      icon: Share2,
      priority: 40,
      keywords: ["share", "send"],
      shortcut: [["s"]],
      handler: async () => {
        /* … */
      },
    },`,
  },
  {
    id: "hero.open",
    code: `    "open": {
      label: "Open in new tab",
      icon: ExternalLink,
      priority: 30,
      keywords: ["open", "tab", "external"],
      shortcut: [["o"]],
      handler: async () => {
        /* … */
      },
    },`,
  },
  {
    id: "hero.rename",
    code: `    "rename": {
      label: "Rename",
      icon: Pencil,
      priority: 20,
      keywords: ["rename", "edit", "title"],
      shortcut: [["r"]],
      handler: async () => {
        /* … */
      },
    },`,
  },
  {
    id: "hero.delete",
    code: `    "delete": {
      label: "Delete",
      icon: Trash2,
      priority: 10,
      danger: true,
      keywords: ["delete", "remove", "trash", "x"],
      shortcut: [["x"]],
      handler: async () => {
        /* … */
      },
    },`,
  },
]

const OVERVIEW_HERO_REGISTRY_PREFIX = `export function heroDemoCommands(getToastTrigger: () => HeroToastTrigger | null) {
  return defineCommands({`

const OVERVIEW_HERO_REGISTRY_SUFFIX = `
  })
}
`

/** Single scrollable source for the Commands tab (blocks joined inside exported factory). */
export const OVERVIEW_HERO_REGISTRY_FULL =
  OVERVIEW_HERO_REGISTRY_PREFIX +
  "\n\n" +
  OVERVIEW_HERO_REGISTRY_BLOCKS.map((b) => b.code).join("\n") +
  OVERVIEW_HERO_REGISTRY_SUFFIX

/** 1-based line numbers in `OVERVIEW_HERO_REGISTRY_FULL` per command (for `data-line` highlight). */
function computeRegistryLineRanges(
  full: string,
  blocks: { id: string; code: string }[],
): Record<string, { start: number; end: number }> {
  const out: Record<string, { start: number; end: number }> = {}
  for (const b of blocks) {
    const idx = full.indexOf(b.code)
    if (idx === -1) continue
    const start = (full.slice(0, idx).match(/\n/g) ?? []).length + 1
    const lineCount = b.code.split("\n").length
    out[b.id] = { start, end: start + lineCount - 1 }
  }
  return out
}

export const OVERVIEW_HERO_REGISTRY_LINE_RANGES = computeRegistryLineRanges(
  OVERVIEW_HERO_REGISTRY_FULL,
  OVERVIEW_HERO_REGISTRY_BLOCKS,
)

export const OVERVIEW_HERO_SURFACE_SNIPPETS: Record<
  HeroToastTrigger,
  { filename: string; code: string }
> = {
  "context-menu": {
    filename: "overview-hero-live.tsx (context menu)",
    code: `export function ContextMenuSurface() {
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

  return (
    <>
      <ContextMenuTrigger
        onContextMenuCapture={handleContextMenuCapture}
      >
        {/* row */}
      </ContextMenuTrigger>

      <HeroContextMenuBody
        model={pinnedModel}
        collisionBoundary={heroCollisionBoundary}
        onCommandActivate={(cmd) => run(cmd.id, "context-menu")}
      />
    </>
  )
}`,
  },
  cmdk: {
    filename: "overview-hero-live.tsx (palette)",
    code: `export function CommandPalette() {
  const { search, setSearch } = useCommandSearch({
    scopes: [OVERVIEW_HERO_SCOPE],
  })

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <Command shouldFilter={false} loop>
        <CommandInput value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandGroup heading={HERO_DEMO_ITEM_TITLE}>
            {paletteRows.map((cmd) => (
              <CommandItem
                key={cmd.id}
                onSelect={() => {
                  run(cmd.id, "cmdk")
                  setPaletteOpen(false)
                }}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}`,
  },
  shortcut: {
    filename: "overview-hero-live.tsx (shortcuts)",
    code: `/** Registry uses shortcuts={false}; this component binds printable keys. */
export function ShortcutBindings() {
  const HERO_PRINTABLE_KEY_TO_COMMAND: Record<string, string> = {
    c: "copy",
    e: "archive",
    s: "share",
    o: "open",
    r: "rename",
    x: "delete",
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!hovering || paletteOpen) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const ch = e.key.length === 1 ? e.key.toLowerCase() : ""
      const id = HERO_PRINTABLE_KEY_TO_COMMAND[ch]
      const cmd = byId.get(id)
      if (!cmd || cmd.disabled) return
      e.preventDefault()
      run(id, "shortcut")
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [hovering, paletteOpen, byId])

  return null
}`,
  },
  toolbar: {
    filename: "overview-hero-live.tsx (toolbar)",
    code: `export function Toolbar() {
  return (
    <>
      {PRIMARY_IDS.map((id) => {
        const cmd = byId.get(id)
        return (
          <PrimaryInlineAction
            key={id}
            cmd={cmd}
            onRun={() => run(id, "toolbar")}
          />
        )
      })}
    </>
  )
}`,
  },
  dropdown: {
    filename: "overview-hero-live.tsx (overflow)",
    code: `export function OverflowMenu() {
  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger>{/* … */}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OVERFLOW_IDS.map((id) => {
          const cmd = byId.get(id)
          return (
            <DropdownMenuItem
              key={id}
              onClick={() => run(id, "dropdown")}
            >
              {cmd.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
  },
}

export const HERO_TOAST_TRIGGER_ORDER: HeroToastTrigger[] = [
  "context-menu",
  "cmdk",
  "shortcut",
  "toolbar",
  "dropdown",
]

export const OVERVIEW_HERO_CODE_TAB_ORDER: OverviewHeroPanelTab[] = [
  "commands",
  ...HERO_TOAST_TRIGGER_ORDER,
]

export const HERO_TOAST_TRIGGER_LABEL: Record<HeroToastTrigger, string> = {
  "context-menu": "context-menu.tsx",
  cmdk: "command-palette.tsx",
  shortcut: "shortcuts.tsx",
  toolbar: "toolbar.tsx",
  dropdown: "overflow-menu.tsx",
}

export const OVERVIEW_HERO_CODE_TAB_LABEL: Record<
  OverviewHeroPanelTab,
  string
> = {
  commands: "commands.ts",
  ...HERO_TOAST_TRIGGER_LABEL,
}
