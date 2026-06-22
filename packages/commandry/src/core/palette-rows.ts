import type { ActiveContext } from '../dom/resolve-active-context'
import { getRegionDepthInContext } from '../dom/resolve-active-context'
import type { ResolvedCommand } from './types'

export interface CommandPaletteRow {
  id: string
  label: string
  group: string
  shortcut?: ResolvedCommand['shortcut']
  icon?: ResolvedCommand['icon']
  disabled?: boolean
  radioCommandId?: string
  run?: () => void
}

export interface PrepareCommandPaletteRowsOptions {
  context: ActiveContext
  multiSelectMode?: boolean
  bulkRegion?: string
  modes?: ReadonlySet<string>
}

/**
 * Flatten resolved commands into rows suitable for cmdk-style palettes.
 */
export function prepareCommandPaletteRows(
  commands: ResolvedCommand[],
  options: PrepareCommandPaletteRowsOptions,
): CommandPaletteRow[] {
  const {
    context,
    multiSelectMode = false,
    bulkRegion = 'thread-item',
    modes,
  } = options

  const filtered = commands.filter(c => {
    if (!c.visible || c.disabled || c.children) return false
    if (multiSelectMode && c.scope === bulkRegion && c.bulkAction !== true) return false
    if (modes?.size) {
      if (c.modes?.length && !c.modes.every(m => modes.has(m))) return false
      if (c.exceptModes?.some(m => modes.has(m))) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (multiSelectMode) {
      const ba = a.bulkAction === true ? 1 : 0
      const bb = b.bulkAction === true ? 1 : 0
      if (bb !== ba) return bb - ba
    }
    const depthA = getRegionDepthInContext(a.scope, context)
    const depthB = getRegionDepthInContext(b.scope, context)
    if (depthA !== depthB) return depthB - depthA
    const groupCmp = (a.group ?? '').localeCompare(b.group ?? '')
    if (groupCmp !== 0) return groupCmp
    return a.label.localeCompare(b.label)
  })

  const rows: CommandPaletteRow[] = []
  const seen = new Set<string>()

  for (const c of sorted) {
    const dedupKey = c.id

    if (c.kind === 'radio' && c.options?.length) {
      if (seen.has(dedupKey)) continue
      seen.add(dedupKey)
      rows.push({
        id: c.id,
        label: c.label,
        group: c.group ?? 'Commands',
        shortcut: c.shortcut,
        icon: c.icon,
        disabled: c.disabled,
        radioCommandId: c.id,
      })
      continue
    }

    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)

    rows.push({
      id: c.id,
      label: c.label,
      group: c.group ?? 'Commands',
      shortcut: c.shortcut,
      icon: c.icon,
      disabled: c.disabled,
      run: () => {
        void c.execute().catch((error) => {
          console.error(`[commandry] Command '${c.id}' failed`, error)
        })
      },
    })
  }

  return rows
}
