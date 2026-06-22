export { CommandryProvider } from './provider'
export type { CommandryProviderProps } from './provider'
export { CommandRegion } from './region'
export type { CommandRegionProps, CommandRegionAnchor } from './region'
export {
  useCommandry,
  useCommand,
  useCommands,
  useCommandSearch,
  useRegisterCommands,
  useShortcutDisplay,
  useShortcutParts,
  useShortcutState,
  useActiveContext,
  useActiveScopes,
  useCommandPalettePin,
  useCommandSurfacePin,
  useModes,
  useSetModes,
} from './hooks'
export { CommandryDevtools } from './devtools'

/** @deprecated Use {@link CommandRegion} */
export { CommandRegion as CommandScope } from './region'
/** @deprecated Use {@link CommandRegionProps} */
export type { CommandRegionProps as CommandScopeProps } from './region'
