import type { ResolvedCommand, ShortcutBinding } from './types'

/**
 * Shortcut bindings and resolved commands both expose `scope` and optional `bulkAction`
 * (from the command definition).
 */
export type BulkSelectionScopedItem = ShortcutBinding | ResolvedCommand

/**
 * While several list items are selected, non-bulk commands in a leaf scope (e.g. `thread-item`)
 * should not run from shortcuts or appear in cmdk / context menus.
 *
 * Returns true if the item should remain available. For any scope other than `scopedLayer`,
 * always returns true. For `scopedLayer`, requires `{ bulkAction: true }` on the definition.
 *
 * @param scopedLayer - Scope name to treat as "one row per command", e.g. `"thread-item"`.
 */
export function keepInBulkSelectionMode(
  item: BulkSelectionScopedItem,
  scopedLayer = 'thread-item',
): boolean {
  return item.scope !== scopedLayer || item.bulkAction === true
}
