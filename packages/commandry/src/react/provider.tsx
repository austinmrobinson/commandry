import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { CommandryContext } from './context'
import type { CommandRegistry } from '../core/registry'
import type { ShortcutAdapter, ShortcutBinding } from '../core/types'
import { SequenceEngine } from '../core/sequence'
import { detectPlatform } from '../core/shortcuts'
import { CommandryDevtools } from './devtools'
import {
  enrichBindingWithRegionDepth,
  isBindingEligibleForContext,
} from '../core/filter-commands-for-context'
import {
  resolveActiveContext,
  updatePointerPosition,
} from '../dom/resolve-active-context'

export interface CommandryProviderProps {
  registry: CommandRegistry
  children: ReactNode
  sequenceTimeout?: number
  shortcuts?: boolean | ShortcutAdapter
  devtools?: boolean
  /**
   * When this returns true, shortcut ties prefer bindings from commands with
   * `{ bulkAction: true }` before the usual region-depth / registration order.
   */
  preferBulkShortcuts?: () => boolean
  /**
   * While `preferBulkShortcuts` is true, bindings for which this returns false are ignored.
   */
  shortcutBindingFilterWhileBulk?: (binding: ShortcutBinding) => boolean
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
    function onPointerMove(e: PointerEvent) {
      updatePointerPosition(e.clientX, e.clientY)
      const context = resolveActiveContext({
        pin: registry.getContextPin() ?? undefined,
        target: e.target,
      })
      registry.setLiveContext(context)
    }

    function refreshContext() {
      const context = resolveActiveContext({
        pin: registry.getContextPin() ?? undefined,
      })
      registry.setLiveContext(context)
    }

    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('focusin', refreshContext, true)
    document.addEventListener('focusout', refreshContext, true)
    refreshContext()

    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('focusin', refreshContext, true)
      document.removeEventListener('focusout', refreshContext, true)
    }
  }, [registry])

  useEffect(() => {
    if (shortcuts === false) return

    function executeCommand(commandId: string): void {
      const context = registry.getEffectiveContext()
      void registry.execute(commandId, undefined, context).catch((error) => {
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

      const context = resolveActiveContext({
        pin: registry.getContextPin() ?? undefined,
        target: event.target,
      })
      registry.setLiveContext(context)

      const bindings = registry.getShortcutBindings()
      const modes = registry.getModes()
      const bulkActive = modes.has('bulk') || preferBulkRef.current?.() === true

      const activeBindings = bindings
        .filter(b => !b.external)
        .filter(b =>
          isBindingEligibleForContext(b, context, {
            bulkSelectionActive: bulkActive,
            bulkRegion: 'thread-item',
          }),
        )
        .map(b => enrichBindingWithRegionDepth(b, context))

      const filterWhileBulk = filterWhileBulkRef.current

      const availableBindings = activeBindings.filter(b => {
        if (b.when && !b.when()) return false
        if (b.enabled && !b.enabled()) return false
        if (bulkActive && filterWhileBulk && !filterWhileBulk(b)) return false
        return true
      })

      sequenceEngine.handleKeyDown(event, availableBindings, executeCommand, {
        preferBulkShortcuts: bulkActive,
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
