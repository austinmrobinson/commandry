import type { ActiveScopeSnapshot, ResolvedCommand } from './types'

/** Selection state used when filtering palette commands for list + thread scopes. */
export interface CommandSurfaceListSelection {
  selectedThreadIds: string[]
  selectedThreadId: string | null
}

function threadIdFromThreadCommandId(id: string): string | null {
  const m = /^thread\.([^.]+)\./.exec(id)
  return m?.[1] ?? null
}

function messageIdFromCommandId(id: string): string | null {
  const m = /^message\.([^.]+)\./.exec(id)
  return m?.[1] ?? null
}

/**
 * Filter search results for a command palette (or similar) using a **pinned or live**
 * {@link ActiveScopeSnapshot}, so the list does not follow every pointer scope change
 * after open, while still respecting which thread/message contexts were active.
 *
 * Pair with {@link CommandRegistry.pinActiveScopeSnapshot} when the surface opens.
 */
export function filterCommandsForSurface(
  commands: ResolvedCommand[],
  activation: ActiveScopeSnapshot,
  listSelection: CommandSurfaceListSelection,
): ResolvedCommand[] {
  const activeScopes = activation.scopes
  const activeSet = new Set(activeScopes)
  const ctxMap = activation.contexts
  const threadCtx = ctxMap.get('thread-item')
  const messageCtx = ctxMap.get('message')
  const activeThreadId =
    typeof threadCtx?.threadId === 'string' ? threadCtx.threadId : null
  const activeMessageId =
    typeof messageCtx?.messageId === 'string' ? messageCtx.messageId : null
  const multi = listSelection.selectedThreadIds.length > 0

  return commands.filter(c => {
    const s = c.scope
    if (s == null || s === '') return true

    if (!activeSet.has(s)) return false

    if (s === 'message') {
      if (!activeMessageId) return false
      const mid = messageIdFromCommandId(c.id)
      return mid === activeMessageId
    }

    if (s === 'thread-item') {
      if (multi) {
        return false
      }
      const tid = threadIdFromThreadCommandId(c.id)
      if (!activeThreadId || !tid) return false
      return tid === activeThreadId
    }

    if (s === 'thread-list') {
      if (multi) return true
      if (activeThreadId && activeSet.has('thread-item')) return false
      return true
    }

    return true
  })
}
