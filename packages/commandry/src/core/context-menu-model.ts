import { keepInBulkSelectionMode } from './bulk-selection'
import type { ResolvedCommand } from './types'
import type { ScopeTree } from './types'

export interface ContextMenuModel {
  /** Scope inferred from the target (deepest `data-commandry-scope` match). */
  menuScope: string | null
  groups: Map<string, ResolvedCommand[]>
  empty: boolean
}

export interface BuildContextMenuModelOptions {
  commands: ResolvedCommand[]
  menuScope: string | null
  scopeTree: ScopeTree
  /** When true, drop non-bulk commands in the scoped list layer (default `thread-item`). */
  bulkSelectionActive?: boolean
  bulkScopedLayer?: string
  /**
   * When not bulk-selecting, restrict `thread-item` / `message` commands to the row or message
   * under the context-menu target (avoids dedupe keeping the wrong `thread.*.archive` instance).
   */
  menuAnchorThreadId?: string | null
  menuAnchorMessageId?: string | null
}

function threadIdFromThreadCommandId(id: string): string | null {
  const m = /^thread\.([^.]+)\./.exec(id)
  return m?.[1] ?? null
}

function messageIdFromMessageCommandId(id: string): string | null {
  const m = /^message\.([^.]+)\./.exec(id)
  return m?.[1] ?? null
}

/**
 * Build grouped context-menu commands from a one-time snapshot. Walks parents in
 * `scopeTree` until some scope has visible actionable commands (same pattern as a
 * native context menu bubbling conceptually “outward”).
 */
export function buildContextMenuModelFromScope(
  options: BuildContextMenuModelOptions,
): ContextMenuModel {
  const {
    commands,
    menuScope,
    scopeTree,
    bulkSelectionActive = false,
    bulkScopedLayer = 'thread-item',
    menuAnchorThreadId = null,
    menuAnchorMessageId = null,
  } = options

  function commandsForScope(scope: string | null): ResolvedCommand[] {
    return commands.filter(c => {
      if (!c.visible || c.disabled || c.children) return false
      if (c.kind !== 'action' && c.kind !== 'toggle' && c.kind !== 'radio') return false
      return c.scope === scope
    })
  }

  let actionable: ResolvedCommand[] = []
  let candidate: string | null = menuScope
  while (actionable.length === 0) {
    actionable = commandsForScope(candidate)
    if (actionable.length > 0 || candidate === null) break
    const node = scopeTree.nodes.get(candidate)
    candidate = node?.parent?.name ?? null
  }

  if (!bulkSelectionActive && menuAnchorThreadId && menuScope === 'thread-item') {
    actionable = actionable.filter(c => {
      if (c.scope !== 'thread-item') return true
      const tid = threadIdFromThreadCommandId(c.id)
      return tid === menuAnchorThreadId
    })
  }

  if (!bulkSelectionActive && menuAnchorMessageId && menuScope === 'message') {
    actionable = actionable.filter(c => {
      if (c.scope !== 'message') return true
      const mid = messageIdFromMessageCommandId(c.id)
      return mid === menuAnchorMessageId
    })
  }

  const bulkFiltered = bulkSelectionActive
    ? actionable.filter(c => keepInBulkSelectionMode(c, bulkScopedLayer))
    : actionable

  bulkFiltered.sort((a, b) => {
    if (bulkSelectionActive) {
      const ba = a.bulkAction === true ? 1 : 0
      const bb = b.bulkAction === true ? 1 : 0
      if (bb !== ba) return bb - ba
    }
    return 0
  })

  const seen = new Set<string>()
  const deduped: ResolvedCommand[] = []
  for (const cmd of bulkFiltered) {
    const key = `${cmd.group ?? ''}::${cmd.label}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(cmd)
  }

  const map = new Map<string, ResolvedCommand[]>()
  for (const cmd of deduped) {
    const group = cmd.group ?? 'Actions'
    const list = map.get(group) ?? []
    list.push(cmd)
    map.set(group, list)
  }

  return { menuScope, groups: map, empty: deduped.length === 0 }
}
