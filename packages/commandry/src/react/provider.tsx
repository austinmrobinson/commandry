import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { CommandryContext } from './context'
import type { CommandRegistry } from '../core/registry'
import type { ShortcutAdapter, ShortcutBinding } from '../core/types'
import { SequenceEngine } from '../core/sequence'
import { detectPlatform } from '../core/shortcuts'
import { CommandryDevtools } from './devtools'

export interface CommandryProviderProps {
  registry: CommandRegistry
  children: ReactNode
  sequenceTimeout?: number
  shortcuts?: boolean | ShortcutAdapter
  /**
   * When true, renders a small floating panel (active scopes, command count).
   * Intended for local development; pair with `process.env.NODE_ENV === 'development'` if needed.
   */
  devtools?: boolean
  /**
   * When this returns true, shortcut ties prefer bindings from commands with
   * `{ bulkAction: true }` before the usual scope-depth / registration order.
   */
  preferBulkShortcuts?: () => boolean
  /**
   * While `preferBulkShortcuts` is true, bindings for which this returns false are ignored
   * (not eligible to handle the key). Pass `keepInBulkSelectionMode` from `commandry` to drop
   * non-`bulkAction` commands in a list-item scope during multi-select.
   */
  shortcutBindingFilterWhileBulk?: (binding: ShortcutBinding) => boolean
  /**
   * Called when a command handler throws or rejects during shortcut execution.
   * If omitted, errors are logged to the console.
   */
  onCommandError?: (error: unknown, commandId: string) => void
}

export function CommandryProvider({
  registry,
  children,
  sequenceTimeout,
  shortcuts = true,
  devtools = false,
  preferBulkShortcuts,
  shortcutBindingFilterWhileBulk,
  onCommandError,
}: CommandryProviderProps) {
  const preferBulkRef = useRef(preferBulkShortcuts)
  preferBulkRef.current = preferBulkShortcuts
  const filterWhileBulkRef = useRef(shortcutBindingFilterWhileBulk)
  filterWhileBulkRef.current = shortcutBindingFilterWhileBulk
  const commandErrorRef = useRef(onCommandError)
  commandErrorRef.current = onCommandError

  const platform = useMemo(() => detectPlatform(), [])
  const sequenceEngine = useMemo(
    () => new SequenceEngine({ timeout: sequenceTimeout, platform }),
    [sequenceTimeout, platform],
  )

  useEffect(() => {
    if (shortcuts === false) return

    function executeCommand(commandId: string): void {
      void registry.execute(commandId).catch((error) => {
        if (commandErrorRef.current) {
          commandErrorRef.current(error, commandId)
          return
        }
        console.error(`[commandry] Command '${commandId}' failed`, error)
      })
    }

    if (typeof shortcuts === 'object') {
      const bindings = registry.getShortcutBindings()
      return shortcuts.bind(bindings, executeCommand)
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.isContentEditable) return
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (!event.metaKey && !event.ctrlKey && !event.altKey) return
      }

      const bindings = registry.getShortcutBindings()
      const activeScopes = registry.getActiveScopes()

      const activeBindings = bindings.filter(b => {
        if (b.external) return false
        if (b.scope === null) return true
        return activeScopes.includes(b.scope)
      })

      const preferBulk = preferBulkRef.current?.() === true
      const filterWhileBulk = filterWhileBulkRef.current

      const availableBindings = activeBindings.filter(b => {
        if (b.when && !b.when()) return false
        if (b.enabled && !b.enabled()) return false
        if (preferBulk && filterWhileBulk && !filterWhileBulk(b)) return false
        return true
      })
      sequenceEngine.handleKeyDown(event, availableBindings, executeCommand, {
        preferBulkShortcuts: preferBulk,
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [registry, shortcuts, sequenceEngine])

  const value = useMemo(
    () => ({ registry, platform, sequenceEngine }),
    [registry, platform, sequenceEngine],
  )

  return (
    <CommandryContext.Provider value={value}>
      {children}
      {devtools ? <CommandryDevtools /> : null}
    </CommandryContext.Provider>
  )
}
