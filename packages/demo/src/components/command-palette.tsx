'use client'

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type KeyboardEvent,
} from 'react'
import {
  type CommandPaletteRow,
  filterCommandsForSurface,
  prepareCommandPaletteRows,
  type ResolvedCommand,
} from 'commandry'
import { useCommandry, useCommandSearch, useShortcutDisplay } from 'commandry/react'
import { setCommandPaletteOpen, useMailStore } from '@/lib/store'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

function useResolvedCommand(id: string | null): ResolvedCommand | null {
  const { registry } = useCommandry()
  return useSyncExternalStore(
    registry.subscribe,
    () => (id ? registry.getCommand(id) : null),
    () => null,
  )
}

function ShortcutHint({ shortcut }: { shortcut: ResolvedCommand['shortcut'] }) {
  const text = useShortcutDisplay(shortcut, 'all')
  if (!text) return null
  return <CommandShortcut>{text}</CommandShortcut>
}

function PaletteItem({
  row,
  onOpenRadio,
}: {
  row: CommandPaletteRow
  onOpenRadio: (commandId: string) => void
}) {
  const Icon = row.icon as ComponentType<{ className?: string }> | undefined
  return (
    <CommandItem
      value={`${row.id} ${row.group} ${row.label}`}
      disabled={row.disabled}
      onSelect={() => {
        if (row.radioCommandId) {
          onOpenRadio(row.radioCommandId)
          return
        }
        row.run?.()
        setCommandPaletteOpen(false)
      }}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      <span>{row.label}</span>
      <ShortcutHint shortcut={row.shortcut} />
    </CommandItem>
  )
}

function RadioPalettePage({
  commandId,
  onPick,
}: {
  commandId: string
  onPick: () => void
}) {
  const cmd = useResolvedCommand(commandId)

  if (!cmd || cmd.kind !== 'radio' || !cmd.options?.length) {
    return (
      <CommandGroup heading="Label">
        <CommandEmpty>Command unavailable.</CommandEmpty>
      </CommandGroup>
    )
  }

  const current = cmd.value?.() ?? 'none'

  return (
    <CommandGroup heading={cmd.group ?? cmd.label}>
      {cmd.options.map(opt => {
        const OptIcon = opt.icon as ComponentType<{ className?: string }> | undefined
        return (
          <CommandItem
            key={opt.id}
            value={`${opt.id} ${opt.label}`}
            keywords={[opt.label]}
            onSelect={() => {
              void cmd.execute({ value: opt.id })
              onPick()
            }}
          >
            {OptIcon ? <OptIcon className="size-4 shrink-0" /> : null}
            <span>{opt.label}</span>
            {opt.id === current ? (
              <span className="ml-auto text-xs text-muted-foreground">Current</span>
            ) : null}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

export function CommandPalette() {
  const { registry } = useCommandry()
  const open = useMailStore(s => s.commandPaletteOpen)
  const selectedThreadIds = useMailStore(s => s.selectedThreadIds)
  const selectedThreadId = useMailStore(s => s.selectedThreadId)
  const multiThreadSelection = selectedThreadIds.length > 0
  const { results, search, setSearch } = useCommandSearch()
  const [pages, setPages] = useState<string[]>([])

  const snapshotPin = useSyncExternalStore(
    registry.subscribe,
    () => registry.getActiveScopeSnapshotPin(),
    () => null,
  )

  const depthFn = useMemo(
    () => (scope: string | null) => registry.getScopeDepth(scope),
    [registry],
  )

  const filteredResults = useMemo(() => {
    const activation = snapshotPin ?? registry.getActiveScopeSnapshot()
    return filterCommandsForSurface(results, activation, {
      selectedThreadIds,
      selectedThreadId,
    })
  }, [snapshotPin, results, registry, selectedThreadIds, selectedThreadId])

  const rows = useMemo(
    () =>
      prepareCommandPaletteRows(filteredResults, {
        getScopeDepth: depthFn,
        multiSelectMode: multiThreadSelection,
      }),
    [filteredResults, depthFn, multiThreadSelection],
  )
  const groups = useMemo(() => {
    const m = new Map<string, CommandPaletteRow[]>()
    for (const row of rows) {
      const list = m.get(row.group) ?? []
      list.push(row)
      m.set(row.group, list)
    }
    return m
  }, [rows])

  const groupEntries = [...groups.entries()]
  const activeRadioId = pages.length > 0 ? pages[pages.length - 1] : null
  const activeRadioCmd = useResolvedCommand(activeRadioId)

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setSearch('')
      setPages([])
    }
    setCommandPaletteOpen(isOpen)
  }, [setSearch])

  const openRadioPage = useCallback(
    (commandId: string) => {
      setPages(p => [...p, commandId])
      setSearch('')
    },
    [setSearch],
  )

  const closeAfterRadioPick = useCallback(() => {
    setCommandPaletteOpen(false)
    setPages([])
  }, [])

  const handleCommandKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (pages.length === 0) return
      if (e.defaultPrevented) return
      if (e.key === 'Escape' || (e.key === 'Backspace' && search === '')) {
        e.preventDefault()
        e.stopPropagation()
        setPages(p => p.slice(0, -1))
      }
    },
    [pages.length, search],
  )

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <Command onKeyDown={handleCommandKeyDown}>
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder={activeRadioId ? `Choose ${activeRadioCmd?.label?.toLowerCase() ?? 'option'}…` : 'Search commands...'}
        />
        {activeRadioId ? (
          <p className="border-b px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{activeRadioCmd?.label ?? 'Options'}</span>
            <span className="mx-2 text-border">·</span>
            Esc or Backspace to go back
          </p>
        ) : null}
        <CommandList>
          {activeRadioId ? (
            <>
              <CommandEmpty>No matching options.</CommandEmpty>
              <RadioPalettePage commandId={activeRadioId} onPick={closeAfterRadioPick} />
            </>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
              {groupEntries.map(([heading, items], gi) => (
                <div key={heading}>
                  {gi > 0 ? <CommandSeparator /> : null}
                  <CommandGroup heading={heading}>
                    {items.map(row => (
                      <PaletteItem key={row.id} row={row} onOpenRadio={openRadioPage} />
                    ))}
                  </CommandGroup>
                </div>
              ))}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
