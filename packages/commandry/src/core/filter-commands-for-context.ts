import type { ActiveContext } from '../dom/resolve-active-context'
import type { BaseCommandDefinition, ResolvedCommand } from './types'

export interface FilterCommandsForContextOptions {
  modes?: ReadonlySet<string>
  /** When true, match per-entity command ids to context anchors (default true). */
  matchAnchor?: boolean
  /** Region name treated as the list-item layer during bulk selection. */
  bulkRegion?: string
  /** When true, hide non-bulk commands in {@link bulkRegion}. */
  bulkSelectionActive?: boolean
  /** Custom id extractors keyed by anchor name (e.g. threadId). */
  anchorExtractors?: Record<string, (commandId: string) => string | null>
}

const DEFAULT_ANCHOR_EXTRACTORS: Record<string, (commandId: string) => string | null> = {
  threadId: (id) => /^thread\.([^.]+)\./.exec(id)?.[1] ?? null,
  messageId: (id) => /^message\.([^.]+)\./.exec(id)?.[1] ?? null,
}

function commandMatchesModes(
  cmd: ResolvedCommand,
  modes: ReadonlySet<string> | undefined,
): boolean {
  if (!modes || modes.size === 0) return true

  const required = cmd.modes as string[] | undefined
  if (required?.length) {
    if (!required.every(m => modes.has(m))) return false
  }

  const except = cmd.exceptModes as string[] | undefined
  if (except?.length) {
    if (except.some(m => modes.has(m))) return false
  }

  return true
}

function commandMatchesAnchor(
  cmd: ResolvedCommand,
  context: ActiveContext,
  extractors: Record<string, (commandId: string) => string | null>,
): boolean {
  for (const [anchorKey, extractor] of Object.entries(extractors)) {
    const anchorValue = context.anchors[anchorKey]
    if (!anchorValue) continue
    if (cmd.scope !== anchorKey.replace(/Id$/, '').replace('thread', 'thread-item').replace('message', 'message')) {
      // scope-based anchor regions
    }
    const extracted = extractor(cmd.id)
    if (extracted != null && extracted !== anchorValue) return false
  }

  // thread-item / message scoped commands with extractors
  if (cmd.scope === 'thread-item' && context.anchors.threadId) {
    const tid = extractors.threadId?.(cmd.id)
    if (tid != null && tid !== context.anchors.threadId) return false
  }
  if (cmd.scope === 'message' && context.anchors.messageId) {
    const mid = extractors.messageId?.(cmd.id)
    if (mid != null && mid !== context.anchors.messageId) return false
  }

  return true
}

/**
 * Filter commands eligible for the current {@link ActiveContext} (shortcuts, palette, menus).
 */
export function filterCommandsForContext(
  commands: ResolvedCommand[],
  context: ActiveContext,
  options: FilterCommandsForContextOptions = {},
): ResolvedCommand[] {
  const {
    modes,
    matchAnchor = true,
    bulkRegion = 'thread-item',
    bulkSelectionActive = false,
    anchorExtractors = DEFAULT_ANCHOR_EXTRACTORS,
  } = options

  const regionSet = new Set(context.regions)
  const hasThreadItem = regionSet.has('thread-item')
  const hasThreadList = regionSet.has('thread-list')

  return commands.filter(c => {
    if (!c.visible || c.disabled) return false
    if (!commandMatchesModes(c, modes)) return false

    const region = c.scope
    if (region == null || region === '') return true

    if (!regionSet.has(region)) return false

    if (bulkSelectionActive && region === bulkRegion && c.bulkAction !== true) {
      return false
    }

    if (region === 'thread-list' && hasThreadItem && !bulkSelectionActive) {
      return false
    }

    if (matchAnchor && !commandMatchesAnchor(c, context, anchorExtractors)) {
      return false
    }

    if (region === 'message' && !context.anchors.messageId && matchAnchor) {
      return false
    }

    if (region === 'thread-item' && bulkSelectionActive) {
      return c.bulkAction === true
    }

    if (region === 'thread-item' && hasThreadItem && !bulkSelectionActive && matchAnchor) {
      const tid = anchorExtractors.threadId?.(c.id)
      if (tid && context.anchors.threadId && tid !== context.anchors.threadId) {
        return false
      }
    }

    void hasThreadList
    return true
  })
}

export function isBindingEligibleForContext(
  binding: {
    scope: string | null
    bulkAction?: boolean
    when?: () => boolean
    enabled?: () => boolean
  },
  context: ActiveContext,
  options: Pick<
    FilterCommandsForContextOptions,
    'bulkRegion' | 'bulkSelectionActive'
  > = {},
): boolean {
  const { bulkRegion = 'thread-item', bulkSelectionActive = false } = options

  if (binding.when && !binding.when()) return false
  if (binding.enabled && !binding.enabled()) return false

  if (binding.scope == null) return true

  if (!context.regions.includes(binding.scope)) return false

  if (
    bulkSelectionActive &&
    binding.scope === bulkRegion &&
    binding.bulkAction !== true
  ) {
    return false
  }

  return true
}

export function enrichBindingWithRegionDepth<
  T extends { scope: string | null; scopeDepth: number | null },
>(binding: T, context: ActiveContext): T {
  if (binding.scope == null) {
    return { ...binding, scopeDepth: null }
  }
  const idx = context.regions.indexOf(binding.scope)
  return { ...binding, scopeDepth: idx === -1 ? null : idx }
}
