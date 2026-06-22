import type { ComponentType } from 'react'
import type { ActiveContext } from '../dom/resolve-active-context'

// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------

export type Platform = 'mac' | 'windows' | 'linux'

// ---------------------------------------------------------------------------
// Shortcuts
// ---------------------------------------------------------------------------

export type KeyToken = string
export type KeyCombo = KeyToken[]
export type Shortcut = KeyCombo[]
export type ShortcutField = Shortcut | Shortcut[]

// ---------------------------------------------------------------------------
// Active context (re-exported for convenience)
// ---------------------------------------------------------------------------

export type { ActiveContext }

/**
 * Frozen {@link ActiveContext} captured when opening a command surface
 * (palette, context menu) so filtering does not follow live pointer changes.
 */
export type PinnedContext = ActiveContext

// ---------------------------------------------------------------------------
// Radio options
// ---------------------------------------------------------------------------

export interface RadioOption {
  id: string
  label: string
  icon?: ComponentType
}

// ---------------------------------------------------------------------------
// Execute args
// ---------------------------------------------------------------------------

export interface ExecuteArgs {
  value?: string
  skipConfirm?: boolean
}

// ---------------------------------------------------------------------------
// Command definitions (what users write)
// ---------------------------------------------------------------------------

export interface BaseCommandDefinition {
  label: string | ((args: { ctx: Record<string, unknown> }) => string)
  icon?: ComponentType | ((args: { ctx: Record<string, unknown> }) => ComponentType)
  description?: string
  group?: string | ((args: { ctx: Record<string, unknown> }) => string)
  keywords?: string[]
  priority?: number
  danger?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  shortcut?: ShortcutField
  /** Region tag; omit to inherit from nearest {@link CommandRegion} at registration. */
  scope?: string
  when?: () => boolean
  enabled?: () => boolean
  shadow?: boolean
  external?: boolean
  bulkAction?: boolean
  /** Require all listed modes to be active for this command to be eligible. */
  modes?: string[]
  /** Hide when any listed mode is active. */
  exceptModes?: string[]
}

export interface ActionCommandDefinition extends BaseCommandDefinition {
  kind?: 'action'
  handler: (args: { ctx: Record<string, unknown> } & ExecuteArgs) => void | Promise<void>
}

export interface ToggleCommandDefinition extends BaseCommandDefinition {
  kind: 'toggle'
  checked: (args: { ctx: Record<string, unknown> }) => boolean
  handler: (args: { ctx: Record<string, unknown> } & ExecuteArgs) => void | Promise<void>
}

export interface RadioCommandDefinition extends BaseCommandDefinition {
  kind: 'radio'
  options: RadioOption[]
  value: (args: { ctx: Record<string, unknown> }) => string
  handler: (args: { ctx: Record<string, unknown>; value: string } & ExecuteArgs) => void | Promise<void>
}

export interface ParentCommandDefinition {
  label: string
  icon?: ComponentType
  description?: string
  group?: string | ((args: { ctx: Record<string, unknown> }) => string)
  scope?: string
  when?: () => boolean
  children: CommandDefinitionMap
}

export type CommandDefinition =
  | ActionCommandDefinition
  | ToggleCommandDefinition
  | RadioCommandDefinition
  | ParentCommandDefinition

export type CommandDefinitionMap = Record<string, CommandDefinition>

// ---------------------------------------------------------------------------
// Internal command (stored in the registry)
// ---------------------------------------------------------------------------

export interface InternalCommand {
  id: string
  definition: CommandDefinition
  scope: string | null
  registrationScope: string | null
  registeredAt: number
}

// ---------------------------------------------------------------------------
// Resolved command (returned by hooks)
// ---------------------------------------------------------------------------

export interface ResolvedCommand {
  id: string
  label: string
  icon: ComponentType | undefined
  description: string | undefined
  group: string | undefined
  keywords: string[]
  priority: number
  danger: boolean
  variant: string | undefined
  shortcut: ShortcutField | undefined
  scope: string | null
  visible: boolean
  disabled: boolean
  pending: boolean
  kind: 'action' | 'toggle' | 'radio' | 'parent'
  children: boolean
  childIds: string[]
  checked: (() => boolean) | undefined
  value: (() => string) | undefined
  options: RadioOption[] | undefined
  execute: (args?: ExecuteArgs) => Promise<void>
  bulkAction?: boolean
  modes?: string[]
  exceptModes?: string[]
}

// ---------------------------------------------------------------------------
// Command filter
// ---------------------------------------------------------------------------

export interface CommandFilter {
  group?: string
  scope?: string
  scopes?: string[]
  parent?: string
}

// ---------------------------------------------------------------------------
// Shortcut binding (what the engine sees)
// ---------------------------------------------------------------------------

export interface ShortcutBinding {
  commandId: string
  shortcut: Shortcut
  scope: string | null
  scopeDepth: number | null
  shadow: boolean
  when?: () => boolean
  enabled?: () => boolean
  external: boolean
  registeredAt: number
  bulkAction?: boolean
}

// ---------------------------------------------------------------------------
// Shortcut display parts
// ---------------------------------------------------------------------------

export interface ShortcutPart {
  glyph: string
  type: 'modifier' | 'key'
}

export interface ShortcutStep {
  step: number
  parts: ShortcutPart[]
}

// ---------------------------------------------------------------------------
// Shortcut adapter
// ---------------------------------------------------------------------------

export interface ShortcutAdapter {
  bind: (
    shortcuts: ShortcutBinding[],
    execute: (commandId: string) => void | Promise<void>,
  ) => () => void
}

// ---------------------------------------------------------------------------
// Sequence state
// ---------------------------------------------------------------------------

export interface SequenceState {
  buffer: KeyCombo[]
  pending: ShortcutBinding[]
  timeoutId: ReturnType<typeof setTimeout> | null
}

// ---------------------------------------------------------------------------
// Registration options (used by React layer)
// ---------------------------------------------------------------------------

export interface RegisterOptions {
  scope?: string | null
  ctx?: Record<string, unknown>
}

/** Selection state for palette filtering in list UIs. */
export interface CommandSurfaceListSelection {
  selectedThreadIds: string[]
  selectedThreadId: string | null
}
