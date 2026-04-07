import type { ComponentType } from 'react'

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
// Scope type utilities
// ---------------------------------------------------------------------------

export interface ScopeDefinition {
  ctx?: Record<string, unknown>
  children?: Record<string, ScopeDefinition>
}

export type ExtractScopeKeys<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T & string]: K | (T[K] extends { children: infer C extends Record<string, unknown> }
        ? ExtractScopeKeys<C>
        : never)
    }[keyof T & string]
  : never

export type FindScope<T, Key extends string> = T extends Record<string, unknown>
  ? Key extends keyof T
    ? T[Key]
    : {
        [K in keyof T & string]: T[K] extends { children: infer C extends Record<string, unknown> }
          ? FindScope<C, Key>
          : never
      }[keyof T & string]
  : never

export type GetScopeCtx<T, Key extends string> =
  FindScope<T, Key> extends { ctx: infer C } ? C : Record<string, never>

export type FindParentKey<
  T,
  Key extends string,
  Parent extends string = never,
> = T extends Record<string, unknown>
  ? {
      [K in keyof T & string]: Key extends K
        ? Parent
        : T[K] extends { children: infer C extends Record<string, unknown> }
          ? FindParentKey<C, Key, K>
          : never
    }[keyof T & string]
  : never

export type MergedScopeCtx<T, Key extends string> =
  GetScopeCtx<T, Key> &
  (FindParentKey<T, Key> extends infer P extends string
    ? MergedScopeCtx<T, P>
    : Record<string, never>)

export type ValidChildren<T, Key extends string> =
  FindScope<T, Key> extends { children: infer C extends Record<string, unknown> }
    ? keyof C & string
    : never

// ---------------------------------------------------------------------------
// Runtime scope tree
// ---------------------------------------------------------------------------

export interface ScopeNode {
  name: string
  parent: ScopeNode | null
  children: Map<string, ScopeNode>
}

export interface ScopeTree {
  root: ScopeNode | null
  nodes: Map<string, ScopeNode>
}

export interface RuntimeScopeConfig {
  children?: Record<string, RuntimeScopeConfig>
}

/**
 * Immutable copy of {@link CommandRegistry.getActiveScopes} + per-scope context maps.
 * Capture synchronously when opening a command palette (before focus moves and
 * pointer-based scopes pop) to pin UI to the user’s gesture.
 */
export interface ActiveScopeSnapshot {
  readonly scopes: readonly string[]
  readonly contexts: ReadonlyMap<string, Record<string, unknown>>
}

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
  scope?: string
  when?: () => boolean
  enabled?: () => boolean
  shadow?: boolean
  external?: boolean
  /**
   * When true, this command participates in multi-target / bulk flows: shortcut
   * resolution can prefer it while `preferBulkShortcuts` is active, and UIs may
   * hide `bulkAction: false` commands when several items are selected.
   */
  bulkAction?: boolean
  [key: string]: unknown
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
  [key: string]: unknown
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
  /** `true` / `false` from the definition; omit on definition means `undefined`. */
  bulkAction?: boolean
  [key: string]: unknown
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
  /** Mirrors command definition `bulkAction` for shortcut tie-breaking. */
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
