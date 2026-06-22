import { filterCommandsForContext } from './filter-commands-for-context'
import type { ActiveContext } from '../dom/resolve-active-context'
import {
  buildContextFromElement,
  getParentRegionElement,
} from '../dom/resolve-active-context'
import { DATA_COMMANDRY_REGION } from '../dom/region-attributes'
import type { ResolvedCommand } from './types'

export interface ContextMenuModel {
  menuRegion: string | null
  groups: Map<string, ResolvedCommand[]>
  empty: boolean
}

export interface BuildContextMenuModelOptions {
  commands: ResolvedCommand[]
  context: ActiveContext
  modes?: ReadonlySet<string>
  bulkSelectionActive?: boolean
  bulkRegion?: string
}

function commandsForRegion(
  commands: ResolvedCommand[],
  region: string | null,
): ResolvedCommand[] {
  return commands.filter(c => {
    if (!c.visible || c.disabled || c.children) return false
    if (c.kind !== 'action' && c.kind !== 'toggle' && c.kind !== 'radio') return false
    return c.scope === region
  })
}

/**
 * Build grouped context-menu commands. Walks parent regions in the DOM when the
 * innermost region has no actionable commands.
 */
export function buildContextMenuModel(
  options: BuildContextMenuModelOptions,
): ContextMenuModel {
  const {
    commands,
    context,
    modes,
    bulkSelectionActive = false,
    bulkRegion = 'thread-item',
  } = options

  const menuRegion = context.regions[context.regions.length - 1] ?? null
  let candidateRegion: string | null = menuRegion
  let candidateElement = context.element
  let regionIndex = context.regions.length - 1

  let filtered = filterCommandsForContext(
    commandsForRegion(commands, candidateRegion),
    context,
    { modes, bulkSelectionActive, bulkRegion, matchAnchor: true },
  )

  while (filtered.length === 0) {
    if (candidateElement) {
      const parentEl = getParentRegionElement(candidateElement)
      if (!parentEl) break
      candidateRegion = parentEl.getAttribute(DATA_COMMANDRY_REGION)
      candidateElement = parentEl

      const parentContext = buildContextFromElement(parentEl)

      filtered = filterCommandsForContext(
        commandsForRegion(commands, candidateRegion),
        parentContext,
        { modes, bulkSelectionActive, bulkRegion, matchAnchor: true },
      )
      continue
    }

    if (regionIndex <= 0) break
    regionIndex -= 1
    candidateRegion = context.regions[regionIndex] ?? null
    const parentRegions = context.regions.slice(0, regionIndex + 1)
    const parentContext: ActiveContext = {
      ...context,
      regions: parentRegions,
    }

    filtered = filterCommandsForContext(
      commandsForRegion(commands, candidateRegion),
      parentContext,
      { modes, bulkSelectionActive, bulkRegion, matchAnchor: true },
    )
  }

  filtered.sort((a, b) => {
    if (bulkSelectionActive) {
      const ba = a.bulkAction === true ? 1 : 0
      const bb = b.bulkAction === true ? 1 : 0
      if (bb !== ba) return bb - ba
    }
    return 0
  })

  const seen = new Set<string>()
  const deduped: ResolvedCommand[] = []
  for (const cmd of filtered) {
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

  return { menuRegion: candidateRegion, groups: map, empty: deduped.length === 0 }
}
