import type { ComponentType } from 'react'
import type {
  ActionCommandDefinition,
  BaseCommandDefinition,
  CommandDefinition,
  CommandDefinitionMap,
  CommandFilter,
  ExecuteArgs,
  InternalCommand,
  ParentCommandDefinition,
  Platform,
  RadioCommandDefinition,
  RegisterOptions,
  ResolvedCommand,
  Shortcut,
  ShortcutBinding,
  ShortcutField,
  ToggleCommandDefinition,
} from './types'
import {
  EMPTY_ACTIVE_CONTEXT,
  type ActiveContext,
} from '../dom/resolve-active-context'
import { normalizeShortcut, shortcutToString } from './shortcuts'
import { searchScore } from './utils'
import { detectPlatform } from './shortcuts'

function isParentCommand(def: CommandDefinition): def is ParentCommandDefinition {
  return 'children' in def && def.children != null
}

function isToggleCommand(def: CommandDefinition): def is ToggleCommandDefinition {
  return 'kind' in def && def.kind === 'toggle'
}

function isRadioCommand(def: CommandDefinition): def is RadioCommandDefinition {
  return 'kind' in def && def.kind === 'radio'
}

const KNOWN_KEYS = new Set([
  'label', 'icon', 'description', 'group', 'keywords', 'priority',
  'danger', 'variant', 'handler', 'shortcut', 'scope', 'when', 'enabled',
  'shadow', 'external', 'kind', 'checked', 'options', 'value', 'children',
  'bulkAction', 'modes', 'exceptModes',
])

export class CommandRegistry {
  private commands = new Map<string, InternalCommand>()
  private listeners = new Set<() => void>()
  private pendingCommands = new Set<string>()
  private registrationContexts = new Map<string, Record<string, unknown>>()
  private version = 0
  private cache = new Map<string, { version: number; result: unknown }>()
  private contextPin: ActiveContext | null = null
  private liveContext: ActiveContext = EMPTY_ACTIVE_CONTEXT
  private modes = new Set<string>()

  readonly platform: Platform

  constructor(options?: { platform?: Platform }) {
    this.platform = options?.platform ?? detectPlatform()
  }

  // -------------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------------

  register(
    commands: CommandDefinitionMap,
    options?: RegisterOptions,
  ): () => void {
    const ids: string[] = []
    const now = Date.now()

    for (const [id, def] of Object.entries(commands)) {
      this.registerOne(id, def, options?.scope ?? null, now)
      ids.push(id)

      if (isParentCommand(def)) {
        for (const [childId, childDef] of Object.entries(def.children)) {
          const fullId = `${id}.${childId}`
          const childScope = def.scope ?? options?.scope ?? null
          this.registerOne(fullId, childDef, childScope, now)
          ids.push(fullId)
        }
      }
    }

    if (options?.ctx) {
      for (const id of ids) {
        this.registrationContexts.set(id, options.ctx)
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      this.checkCollisions()
    }

    this.notify()

    return () => {
      this.unregister(ids)
    }
  }

  private registerOne(
    id: string,
    definition: CommandDefinition,
    registrationScope: string | null,
    now: number,
  ): void {
    const scope = ('scope' in definition && definition.scope != null)
      ? definition.scope
      : registrationScope

    if (process.env.NODE_ENV !== 'production' && this.commands.has(id)) {
      console.warn(
        `⚠️ [commandry] Duplicate command ID: '${id}'. Last registration wins.`,
      )
    }

    this.commands.set(id, {
      id,
      definition,
      scope,
      registrationScope,
      registeredAt: now,
    })
  }

  unregister(commandIds: string[]): void {
    let changed = false
    for (const id of commandIds) {
      if (this.commands.delete(id)) {
        this.registrationContexts.delete(id)
        changed = true
      }
    }
    if (changed) this.notify()
  }

  updateRegistrationContext(
    commands: CommandDefinitionMap,
    ctx: Record<string, unknown>,
  ): void {
    for (const id of Object.keys(commands)) {
      this.registrationContexts.set(id, ctx)
    }
    this.notify()
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  getCommand(id: string): ResolvedCommand | null {
    const cacheKey = `cmd:${id}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.version === this.version) return cached.result as ResolvedCommand | null

    const internal = this.commands.get(id)
    if (!internal) {
      this.cache.set(cacheKey, { version: this.version, result: null })
      return null
    }

    const result = this.resolve(internal)
    this.cache.set(cacheKey, { version: this.version, result })
    return result
  }

  getCommands(filter?: CommandFilter): ResolvedCommand[] {
    const cacheKey = `cmds:${JSON.stringify(filter ?? {})}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.version === this.version) return cached.result as ResolvedCommand[]

    const results: ResolvedCommand[] = []
    for (const internal of this.commands.values()) {
      if (filter?.group) {
        const mergedCtx = this.getMergedContext(internal)
        if (this.resolveGroup(internal.definition, { ctx: mergedCtx }) !== filter.group) continue
      }
      if (filter?.scope && internal.scope !== filter.scope) continue
      if (filter?.scopes && internal.scope && !filter.scopes.includes(internal.scope)) continue
      if (filter?.parent) {
        if (!internal.id.startsWith(filter.parent + '.')) continue
        const rest = internal.id.slice(filter.parent.length + 1)
        if (rest.includes('.')) continue
      }

      const resolved = this.resolve(internal)
      results.push(resolved)
    }

    results.sort((a, b) => {
      const groupCmp = (a.group ?? '').localeCompare(b.group ?? '')
      if (groupCmp !== 0) return groupCmp
      const priCmp = b.priority - a.priority
      if (priCmp !== 0) return priCmp
      return a.label.localeCompare(b.label)
    })

    this.cache.set(cacheKey, { version: this.version, result: results })
    return results
  }

  getChildren(parentId: string): ResolvedCommand[] {
    return this.getCommands({ parent: parentId })
  }

  search(query: string): ResolvedCommand[] {
    if (!query) return this.getCommands()

    const cacheKey = `search:${query}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.version === this.version) return cached.result as ResolvedCommand[]

    const scored: Array<{ command: ResolvedCommand; score: number }> = []

    for (const internal of this.commands.values()) {
      const resolved = this.resolve(internal)
      if (!resolved.visible) continue

      const score = searchScore(
        query,
        resolved.label,
        resolved.keywords,
        resolved.description,
      )
      if (score > 0) {
        scored.push({ command: resolved, score })
      }
    }

    scored.sort((a, b) => {
      const scoreDiff = b.score - a.score
      if (scoreDiff !== 0) return scoreDiff
      return b.command.priority - a.command.priority
    })

    const result = scored.map(s => s.command)
    this.cache.set(cacheKey, { version: this.version, result })
    return result
  }

  // -------------------------------------------------------------------------
  // Active context + modes
  // -------------------------------------------------------------------------

  setLiveContext(context: ActiveContext): void {
    this.liveContext = context
    this.notify()
  }

  getLiveContext(): ActiveContext {
    return this.liveContext
  }

  getEffectiveContext(): ActiveContext {
    return this.contextPin ?? this.liveContext
  }

  pinContext(context: ActiveContext): void {
    this.contextPin = context
    this.notify()
  }

  clearContextPin(): void {
    if (this.contextPin === null) return
    this.contextPin = null
    this.notify()
  }

  getContextPin(): ActiveContext | null {
    return this.contextPin
  }

  setModes(modes: Iterable<string>): void {
    this.modes = new Set(modes)
    this.notify()
  }

  getModes(): ReadonlySet<string> {
    return this.modes
  }

  getRegionDepth(region: string | null, context?: ActiveContext): number {
    if (!region) return -1
    const ctx = context ?? this.getEffectiveContext()
    const idx = ctx.regions.indexOf(region)
    return idx === -1 ? -1 : idx
  }

  // -------------------------------------------------------------------------
  // Execution
  // -------------------------------------------------------------------------

  async execute(id: string, args?: ExecuteArgs, context?: ActiveContext): Promise<void> {
    const internal = this.commands.get(id)
    if (!internal) return

    const resolved = this.resolve(internal, context)
    if (!resolved.visible || resolved.disabled || resolved.pending) return

    if (isParentCommand(internal.definition)) return

    this.pendingCommands.add(id)
    this.notify()

    try {
      const ctx = this.getMergedContext(internal, context)

      if (isRadioCommand(internal.definition)) {
        await internal.definition.handler({
          ctx,
          value: args?.value ?? '',
          skipConfirm: args?.skipConfirm,
        })
      } else {
        const handlerDef = internal.definition as ActionCommandDefinition | ToggleCommandDefinition
        await handlerDef.handler({ ctx, ...args })
      }
    } finally {
      this.pendingCommands.delete(id)
      this.notify()
    }
  }

  // -------------------------------------------------------------------------
  // Shortcuts
  // -------------------------------------------------------------------------

  getShortcutBindings(): ShortcutBinding[] {
    const bindings: ShortcutBinding[] = []

    for (const internal of this.commands.values()) {
      const def = internal.definition
      if (isParentCommand(def)) continue

      const shortcutField = 'shortcut' in def ? def.shortcut : undefined
      if (!shortcutField) continue

      const shortcuts = this.normalizeShortcutField(shortcutField)

      for (const shortcut of shortcuts) {
        bindings.push({
          commandId: internal.id,
          shortcut: normalizeShortcut(shortcut, this.platform),
          scope: internal.scope,
          scopeDepth: null,
          shadow: ('shadow' in def && def.shadow === true),
          when: 'when' in def ? def.when : undefined,
          enabled: 'enabled' in def ? def.enabled : undefined,
          external: ('external' in def && def.external === true),
          registeredAt: internal.registeredAt,
          bulkAction:
            'bulkAction' in def && (def as BaseCommandDefinition).bulkAction === true,
        })
      }
    }

    return bindings
  }

  checkCollisions(): void {
    const bindings = this.getShortcutBindings()

    const byScope = new Map<string | null, ShortcutBinding[]>()
    for (const b of bindings) {
      const key = b.scope ?? '__global__'
      const group = byScope.get(key) ?? []
      group.push(b)
      byScope.set(key, group)
    }

    for (const [scope, scopeBindings] of byScope) {
      for (let i = 0; i < scopeBindings.length; i++) {
        for (let j = i + 1; j < scopeBindings.length; j++) {
          const a = scopeBindings[i]
          const b = scopeBindings[j]
          const aStr = shortcutToString(a.shortcut, this.platform)
          const bStr = shortcutToString(b.shortcut, this.platform)

          if (aStr === bStr) {
            const scopeLabel = scope === '__global__' ? 'global' : scope
            console.warn(
              `⚠️ [commandry] Shortcut collision: '${aStr}' in region '${scopeLabel}'\n` +
              `  → '${a.commandId}'\n` +
              `  → '${b.commandId}'\n` +
              `  Last registered wins.`,
            )
          }
        }
      }
    }

    for (const [, scopeBindings] of byScope) {
      const singles = scopeBindings.filter(b => b.shortcut.length === 1)
      const sequences = scopeBindings.filter(b => b.shortcut.length > 1)

      for (const single of singles) {
        const sStr = shortcutToString(single.shortcut, this.platform)
        for (const seq of sequences) {
          const firstStep = shortcutToString([seq.shortcut[0]], this.platform)
          if (sStr === firstStep) {
            console.warn(
              `⚠️ [commandry] Prefix collision in region '${single.scope ?? 'global'}':\n` +
              `  '${sStr}' is both a complete shortcut (${single.commandId}) and\n` +
              `  the start of a sequence (${seq.commandId}: ${shortcutToString(seq.shortcut, this.platform)})\n` +
              `  ${single.commandId} will never fire.`,
            )
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Subscription
  // -------------------------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  notify(): void {
    this.version++
    this.cache.clear()
    for (const listener of this.listeners) {
      listener()
    }
  }

  // -------------------------------------------------------------------------
  // Internal resolution
  // -------------------------------------------------------------------------

  private resolve(internal: InternalCommand, context?: ActiveContext): ResolvedCommand {
    const def = internal.definition
    const ctx = this.getMergedContext(internal, context)
    const ctxArg = { ctx }

    const label = typeof def.label === 'function' ? def.label(ctxArg) : def.label

    let icon: ComponentType | undefined
    if (isParentCommand(def)) {
      icon = def.icon
    } else if ('icon' in def && def.icon != null) {
      const iconField = def.icon
      if (typeof iconField === 'function' && iconField.length > 0) {
        icon = (iconField as (args: { ctx: Record<string, unknown> }) => ComponentType)(ctxArg)
      } else if (typeof iconField === 'function') {
        icon = iconField as ComponentType
      } else {
        icon = iconField
      }
    }

    const whenFn = 'when' in def ? (def as BaseCommandDefinition).when : undefined
    const enabledFn = 'enabled' in def ? (def as BaseCommandDefinition).enabled : undefined
    const when = whenFn ? whenFn() : true
    const enabled = enabledFn ? enabledFn() : true

    const kind = isParentCommand(def)
      ? 'parent' as const
      : isToggleCommand(def)
        ? 'toggle' as const
        : isRadioCommand(def)
          ? 'radio' as const
          : 'action' as const

    const childIds = isParentCommand(def)
      ? Object.keys(def.children).map(k => `${internal.id}.${k}`)
      : []

    const baseDef = isParentCommand(def) ? def : def as BaseCommandDefinition

    const resolved: ResolvedCommand = {
      id: internal.id,
      label,
      icon,
      description: 'description' in def ? def.description : undefined,
      group: this.resolveGroup(def, ctxArg),
      scope: internal.scope,
      keywords: ('keywords' in def && def.keywords) ? def.keywords : [],
      priority: ('priority' in def && def.priority != null) ? def.priority : 0,
      danger: ('danger' in def && def.danger === true),
      variant: ('variant' in def ? def.variant : undefined),
      shortcut: ('shortcut' in def ? def.shortcut : undefined),
      visible: when,
      disabled: !enabled,
      pending: this.pendingCommands.has(internal.id),
      kind,
      children: isParentCommand(def),
      childIds,
      checked: isToggleCommand(def) ? () => def.checked(ctxArg) : undefined,
      value: isRadioCommand(def) ? () => def.value(ctxArg) : undefined,
      options: isRadioCommand(def) ? def.options : undefined,
      execute: (args?: ExecuteArgs) => this.execute(internal.id, args, context),
      bulkAction: 'bulkAction' in baseDef ? baseDef.bulkAction : undefined,
      modes: 'modes' in baseDef ? baseDef.modes : undefined,
      exceptModes: 'exceptModes' in baseDef ? baseDef.exceptModes : undefined,
    }

    return resolved
  }

  private getMergedContext(
    internal: InternalCommand,
    context?: ActiveContext,
  ): Record<string, unknown> {
    const registrationCtx = this.registrationContexts.get(internal.id) ?? {}
    const regionCtx = (context ?? this.getEffectiveContext()).ctx
    return { ...regionCtx, ...registrationCtx }
  }

  private resolveGroup(
    def: CommandDefinition,
    ctxArg: { ctx: Record<string, unknown> },
  ): string | undefined {
    if (!('group' in def) || def.group === undefined) return undefined
    const g = def.group
    if (typeof g === 'function') return g(ctxArg)
    return g
  }

  private normalizeShortcutField(field: ShortcutField): Shortcut[] {
    if (!field || field.length === 0) return []

    const first = field[0]
    if (Array.isArray(first) && Array.isArray(first[0])) {
      return field as Shortcut[]
    }
    return [field as Shortcut]
  }
}
