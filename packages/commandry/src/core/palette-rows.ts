import { keepInBulkSelectionMode } from './bulk-selection'
import type { ResolvedCommand } from './types'

export interface CommandPaletteRow {
  id: string
  label: string
  group: string
  shortcut?: ResolvedCommand['shortcut']
  icon?: ResolvedCommand['icon']
  disabled?: boolean
  /** Present for `kind: 'radio'` — open a sub-page to pick an option. */
  radioCommandId?: string
  run?: () => void
}

export interface PrepareCommandPaletteRowsOptions {
  getScopeDepth: (scope: string | null) => number
  multiSelectMode?: boolean
  bulkScopedLayer?: string
}

/**
 * Flatten resolved commands into rows suitable for cmdk-style palettes: optional bulk
 * filter, sort by scope depth / group / label, dedupe by command id, one row per radio group.
 */
export function prepareCommandPaletteRows(
  commands: ResolvedCommand[],
  options: PrepareCommandPaletteRowsOptions,
): CommandPaletteRow[] {
  const {
    getScopeDepth,
    multiSelectMode = false,
    bulkScopedLayer = 'thread-item',
  } = options

  const filtered = multiSelectMode
    ? commands.filter(c => keepInBulkSelectionMode(c, bulkScopedLayer))
    : commands

  const sorted = [...filtered].sort((a, b) => {
    if (multiSelectMode) {
      const ba = a.bulkAction === true ? 1 : 0
      const bb = b.bulkAction === true ? 1 : 0
      if (bb !== ba) return bb - ba
    }
    const depthA = getScopeDepth(a.scope)
    const depthB = getScopeDepth(b.scope)
    if (depthA !== depthB) return depthB - depthA
    const groupCmp = (a.group ?? '').localeCompare(b.group ?? '')
    if (groupCmp !== 0) return groupCmp
    return a.label.localeCompare(b.label)
  })

  const rows: CommandPaletteRow[] = []
  const seen = new Set<string>()

  for (const c of sorted) {
    if (!c.visible || c.disabled) continue
    if (c.children) continue

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
