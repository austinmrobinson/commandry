export { CommandRegistry } from './core/registry'
export { SequenceEngine } from './core/sequence'
export { buildScopeTree, mergeContext, isValidChild, getAncestors, isAncestorOf } from './core/scope'
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
export { createCommandry } from './factory'
export {
  keepInBulkSelectionMode,
  type BulkSelectionScopedItem,
} from './core/bulk-selection'
export {
  buildContextMenuModelFromScope,
  type ContextMenuModel,
  type BuildContextMenuModelOptions,
} from './core/context-menu-model'
export {
  filterCommandsForSurface,
  type CommandSurfaceListSelection,
} from './core/filter-commands-for-surface'
export {
  prepareCommandPaletteRows,
  type CommandPaletteRow,
  type PrepareCommandPaletteRowsOptions,
} from './core/palette-rows'
export {
  DATA_COMMANDRY_SCOPE,
  DATA_COMMANDRY_THREAD_ID,
  DATA_COMMANDRY_MESSAGE_ID,
  resolveCommandryScopeFromTarget,
  type ResolvedCommandryScopeTarget,
} from './dom/resolve-scope-from-target'

export type {
  Platform,
  KeyToken,
  KeyCombo,
  Shortcut,
  ShortcutField,
  ActiveScopeSnapshot,
  ScopeDefinition,
  ExtractScopeKeys,
  FindScope,
  GetScopeCtx,
  MergedScopeCtx,
  ValidChildren,
  FindParentKey,
  ScopeNode,
  ScopeTree,
  RuntimeScopeConfig,
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
} from './core/types'
