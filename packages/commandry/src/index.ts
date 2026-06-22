export { CommandRegistry } from './core/registry'
export { SequenceEngine } from './core/sequence'
export {
  detectPlatform,
  normalizeCombo,
  normalizeShortcut,
  matchesCombo,
  combosMatch,
  eventToCombo,
  displayCombo,
  displayShortcut,
  shortcutToParts,
  shortcutToString,
} from './core/shortcuts'
export { searchScore } from './core/utils'
export { createRegistry } from './factory'
export {
  keepInBulkSelectionMode,
  type BulkSelectionScopedItem,
} from './core/bulk-selection'
export {
  buildContextMenuModel,
  type ContextMenuModel,
  type BuildContextMenuModelOptions,
} from './core/context-menu-model'
export {
  filterCommandsForContext,
  isBindingEligibleForContext,
  enrichBindingWithRegionDepth,
  type FilterCommandsForContextOptions,
} from './core/filter-commands-for-context'
export {
  filterCommandsForSurface,
} from './core/filter-commands-for-surface'
export {
  prepareCommandPaletteRows,
  type CommandPaletteRow,
  type PrepareCommandPaletteRowsOptions,
} from './core/palette-rows'
export {
  DATA_COMMANDRY_REGION,
  DATA_COMMANDRY_ACTIVE,
  DATA_COMMANDRY_HOVER,
  DATA_COMMANDRY_THREAD_ID,
  DATA_COMMANDRY_MESSAGE_ID,
} from './dom/region-attributes'
export {
  resolveActiveContext,
  resolveRegionFromTarget,
  getParentRegionElement,
  getRegionDepthInContext,
  updatePointerPosition,
  EMPTY_ACTIVE_CONTEXT,
  type ActiveContext,
  type ResolveActiveContextOptions,
} from './dom/resolve-active-context'
export {
  setRegionContext,
  getRegionContext,
  deleteRegionContext,
} from './dom/region-context-store'

export type {
  Platform,
  KeyToken,
  KeyCombo,
  Shortcut,
  ShortcutField,
  PinnedContext,
  RadioOption,
  ExecuteArgs,
  BaseCommandDefinition,
  ActionCommandDefinition,
  ToggleCommandDefinition,
  RadioCommandDefinition,
  ParentCommandDefinition,
  CommandDefinition,
  CommandDefinitionMap,
  InternalCommand,
  ResolvedCommand,
  CommandFilter,
  ShortcutBinding,
  ShortcutPart,
  ShortcutStep,
  ShortcutAdapter,
  SequenceState,
  RegisterOptions,
  CommandSurfaceListSelection,
} from './core/types'

/** @deprecated Use {@link createRegistry} */
export { createRegistry as createCommandry } from './factory'

/** @deprecated Use {@link buildContextMenuModel} */
export { buildContextMenuModel as buildContextMenuModelFromScope } from './core/context-menu-model'

/** @deprecated Use {@link DATA_COMMANDRY_REGION} */
export { DATA_COMMANDRY_REGION as DATA_COMMANDRY_SCOPE } from './dom/region-attributes'

/** @deprecated Use {@link resolveRegionFromTarget} */
export {
  resolveRegionFromTarget as resolveCommandryScopeFromTarget,
} from './dom/resolve-active-context'

export type {
  ActiveContext as ActiveScopeSnapshot,
} from './dom/resolve-active-context'

export type ResolvedCommandryScopeTarget = {
  scope: string | null
  scopeElement: HTMLElement | null
  threadId: string | null
  messageId: string | null
}
