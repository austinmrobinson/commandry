import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { CommandryContext, ScopeContext } from './context'
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

export function useCommandSearch(options?: { scopes?: string[] }): {
  results: ResolvedCommand[]
  search: string
  setSearch: (s: string) => void
} {
  const { registry } = useCommandry()
  const [search, setSearch] = useState('')

  const results = useSyncExternalStore(
    registry.subscribe,
    () => {
      if (!search) return registry.getCommands(options?.scopes ? { scopes: options.scopes } : undefined)
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
  const scopeCtx = useContext(ScopeContext)

  useEffect(() => {
    const cleanup = registry.register(commands, {
      scope: scopeCtx.scope,
      ctx: options?.ctx,
    })
    return cleanup
  }, [commands, registry, scopeCtx.scope])

  useEffect(() => {
    if (options?.ctx) {
      registry.updateRegistrationContext(commands, options.ctx)
    }
  }, [options?.ctx])
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

export function useActiveScopes(): string[] {
  const { registry } = useCommandry()
  return useSyncExternalStore(
    registry.subscribe,
    () => registry.getActiveScopes(),
  )
}

/**
 * Pin {@link CommandRegistry.getActiveScopeSnapshot} while `open` is true (e.g. command palette).
 * Clears the pin when the surface closes.
 *
 * Prefer calling {@link CommandRegistry.pinActiveScopeSnapshot} **synchronously** in the same
 * turn as opening (e.g. before `setState`) to avoid one frame of palette filtering before
 * the pin exists; this hook uses `useLayoutEffect` as a best-effort fallback.
 */
export function useCommandPalettePin(open: boolean): void {
  const { registry } = useCommandry()

  useLayoutEffect(() => {
    if (!open) {
      registry.clearActiveScopeSnapshotPin()
      return
    }
    registry.pinActiveScopeSnapshot()
    return () => {
      registry.clearActiveScopeSnapshotPin()
    }
  }, [open, registry])
}

export const useCommandSurfacePin = useCommandPalettePin
