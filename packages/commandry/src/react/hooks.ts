import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { CommandryContext, RegionContext } from './context'
import type { CommandryContextValue } from './context'
import type {
  CommandDefinitionMap,
  CommandFilter,
  KeyCombo,
  ResolvedCommand,
  Shortcut,
  ShortcutField,
  ShortcutStep,
} from '../core/types'
import { displayShortcut, shortcutToParts } from '../core/shortcuts'
import { resolveActiveContext } from '../dom/resolve-active-context'
import type { ActiveContext } from '../dom/resolve-active-context'

export function useCommandry(): CommandryContextValue {
  const ctx = useContext(CommandryContext)
  if (!ctx) throw new Error('useCommandry must be used within a CommandryProvider')
  return ctx
}

export function useCommand(id: string): ResolvedCommand | null {
  const { registry } = useCommandry()
  return useSyncExternalStore(
    registry.subscribe,
    () => registry.getCommand(id),
  )
}

export function useCommands(filter?: CommandFilter): ResolvedCommand[] {
  const { registry } = useCommandry()
  const stableFilter = useMemo(() => filter, [JSON.stringify(filter)])
  return useSyncExternalStore(
    registry.subscribe,
    () => registry.getCommands(stableFilter),
  )
}

export function useCommandSearch(options?: { regions?: string[] }): {
  results: ResolvedCommand[]
  search: string
  setSearch: (s: string) => void
} {
  const { registry } = useCommandry()
  const [search, setSearch] = useState('')

  const results = useSyncExternalStore(
    registry.subscribe,
    () => {
      const scopes = options?.regions
      if (!search) {
        return registry.getCommands(scopes ? { scopes } : undefined)
      }
      return registry.search(search)
    },
  )

  return { results, search, setSearch }
}

export function useRegisterCommands(
  commands: CommandDefinitionMap,
  options?: { ctx?: Record<string, unknown> },
): void {
  const { registry } = useCommandry()
  const regionCtx = useContext(RegionContext)

  useEffect(() => {
    const cleanup = registry.register(commands, {
      scope: regionCtx.region,
      ctx: options?.ctx,
    })
    return cleanup
  }, [commands, registry, regionCtx.region])

  useEffect(() => {
    if (options?.ctx) {
      registry.updateRegistrationContext(commands, options.ctx)
    }
  }, [options?.ctx, commands, registry])
}

export function useShortcutDisplay(
  shortcut: ShortcutField | undefined,
  index?: number | 'all',
): string {
  const { platform } = useCommandry()

  if (!shortcut || shortcut.length === 0) return ''

  const first = shortcut[0]
  const isMultiple = Array.isArray(first) && Array.isArray(first[0])

  if (!isMultiple) {
    return displayShortcut(shortcut as Shortcut, platform)
  }

  const shortcuts = shortcut as Shortcut[]
  if (index === 'all') {
    return shortcuts.map(s => displayShortcut(s, platform)).join(', ')
  }

  const i = typeof index === 'number' ? index : 0
  return shortcuts[i] ? displayShortcut(shortcuts[i], platform) : ''
}

export function useShortcutParts(shortcut: Shortcut | undefined): ShortcutStep[] {
  const { platform } = useCommandry()
  if (!shortcut) return []
  return shortcutToParts(shortcut, platform)
}

export function useShortcutState(): {
  buffer: KeyCombo[]
  pending: ResolvedCommand[]
} {
  const { sequenceEngine, registry } = useCommandry()
  const cachedRef = useRef<{ buffer: KeyCombo[]; pending: ResolvedCommand[] }>({
    buffer: [],
    pending: [],
  })

  return useSyncExternalStore(
    useCallback((cb: () => void) => sequenceEngine.subscribe(cb), [sequenceEngine]),
    () => {
      const { buffer, pending } = sequenceEngine.getState()
      const newPending = pending
        .map(b => registry.getCommand(b.commandId))
        .filter((c): c is ResolvedCommand => c !== null)

      if (
        cachedRef.current.buffer === buffer &&
        cachedRef.current.pending.length === newPending.length
      ) {
        return cachedRef.current
      }

      cachedRef.current = { buffer, pending: newPending }
      return cachedRef.current
    },
  )
}

export function useActiveContext(): ActiveContext {
  const { registry } = useCommandry()
  return useSyncExternalStore(
    registry.subscribe,
    () => registry.getEffectiveContext(),
  )
}

/** @deprecated Use {@link useActiveContext} */
export function useActiveScopes(): string[] {
  const context = useActiveContext()
  return context.regions
}

/**
 * Pin active context while `open` is true (e.g. command palette).
 * Prefer calling {@link CommandRegistry.pinContext} synchronously when opening.
 */
export function useCommandPalettePin(open: boolean): void {
  const { registry } = useCommandry()

  useLayoutEffect(() => {
    if (!open) {
      registry.clearContextPin()
      return
    }
    const context = resolveActiveContext()
    registry.pinContext(context)
    return () => {
      registry.clearContextPin()
    }
  }, [open, registry])
}

export const useCommandSurfacePin = useCommandPalettePin

export function useModes(): ReadonlySet<string> {
  const { registry } = useCommandry()
  return useSyncExternalStore(
    registry.subscribe,
    () => registry.getModes(),
  )
}

export function useSetModes(): (modes: Iterable<string>) => void {
  const { registry } = useCommandry()
  return useCallback((modes: Iterable<string>) => {
    registry.setModes(modes)
  }, [registry])
}
