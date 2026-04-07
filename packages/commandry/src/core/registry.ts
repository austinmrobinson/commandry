import type { ComponentType } from 'react'
import type {
  ActionCommandDefinition,
  ActiveScopeSnapshot,
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
  RuntimeScopeConfig,
  Shortcut,
  ShortcutBinding,
  ShortcutField,
  ScopeTree,
  ToggleCommandDefinition,
} from './types'
import { buildScopeTree, isAncestorOf, mergeContext } from './scope'
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
  'bulkAction',
])

export class CommandRegistry {
  private commands = new Map<string, InternalCommand>()
  private listeners = new Set<() => void>()
  private scopeStack: string[] = []
  private scopeContexts = new Map<string, Record<string, unknown>>()
  /** LIFO holders per scope name so multiple CommandScope nodes can share one stack entry */
  private scopeHolderStacks = new Map<string, { id: number; ctx: Record<string, unknown> }[]>()
  private holderIdSeq = 0
  private pendingCommands = new Set<string>()
  private registrationContexts = new Map<string, Record<string, unknown>>()
  private version = 0
  private cache = new Map<string, { version: number; result: unknown }>()
  /** Frozen snapshot for command surfaces (palette, etc.) while focus/pointer scopes change */
  private activeScopeSnapshotPin: ActiveScopeSnapshot | null = null

  readonly scopeTree: ScopeTree
  readonly platform: Platform

  constructor(options?: {
    scopes?: Record<string, RuntimeScopeConfig>
    platform?: Platform
  }) {
    this.scopeTree = options?.scopes
      ? buildScopeTree(options.scopes)
      : { root: null, nodes: new Map() }
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
  // Scope management
  // -------------------------------------------------------------------------

  /**
   * Activates a scope holder. Returns an opaque id so callers can remove or update **this**
   * activation without relying on LIFO `popScope` (needed when multiple instances share a scope name).
   */
  pushScope(scope: string, ctx: Record<string, unknown>): number {
    const id = ++this.holderIdSeq
    const holders = this.scopeHolderStacks.get(scope) ?? []
    const wasEmpty = holders.length === 0
    holders.push({ id, ctx })
    this.scopeHolderStacks.set(scope, holders)

    if (wasEmpty) {
      const depth = this.getScopeDepth(scope)
      let insertIdx = this.scopeStack.length
      for (let i = 0; i < this.scopeStack.length; i++) {
        if (this.getScopeDepth(this.scopeStack[i]) > depth) {
          insertIdx = i
          break
        }
      }
      this.scopeStack.splice(insertIdx, 0, scope)
    }

    this.scopeContexts.set(scope, ctx)
    this.notify()
    this.warnIfScopeTreeViolated(scope)
    return id
  }

  /**
   * Dev-only: unknown scope names and pairwise incomparable scopes on the active stack
   * (neither is an ancestor of the other in the configured tree).
   */
  private warnIfScopeTreeViolated(pushedScope: string): void {
    if (process.env.NODE_ENV === 'production') return
    const tree = this.scopeTree
    if (tree.nodes.size === 0) return

    if (!tree.nodes.has(pushedScope)) {
      console.warn(
        `⚠️ [commandry] Unknown scope '${pushedScope}' — not defined in createCommandry({ scopes }) tree`,
      )
    }

    const scopes = [...this.scopeStack]
    for (let i = 0; i < scopes.length; i++) {
      for (let j = i + 1; j < scopes.length; j++) {
        const a = scopes[i]
        const b = scopes[j]
        if (!tree.nodes.has(a) || !tree.nodes.has(b)) continue
        const aAncB = isAncestorOf(tree, a, b)
        const bAncA = isAncestorOf(tree, b, a)
        if (!aAncB && !bAncA) {
          console.warn(
            `⚠️ [commandry] Incompatible active scopes (not ancestor/descendant in scope tree): '${a}' and '${b}'`,
          )
        }
      }
    }
  }

  /** Removes the most recently pushed holder for `scope` (legacy / symmetric pointer leave). */
  popScope(scope: string): void {
    const holders = this.scopeHolderStacks.get(scope)
    if (!holders || holders.length === 0) return
    const top = holders[holders.length - 1]
    this.removeScopeHolder(top.id)
  }

  /** Remove a specific holder created by `pushScope` (safe with overlapping same-named scopes). */
  removeScopeHolder(holderId: number): void {
    for (const [scope, holders] of this.scopeHolderStacks) {
      const idx = holders.findIndex(h => h.id === holderId)
      if (idx === -1) continue

      holders.splice(idx, 1)
      if (holders.length === 0) {
        this.scopeHolderStacks.delete(scope)
        const index = this.scopeStack.lastIndexOf(scope)
        if (index !== -1) this.scopeStack.splice(index, 1)
        this.scopeContexts.delete(scope)
      } else {
        this.scopeContexts.set(scope, holders[holders.length - 1].ctx)
      }
      this.notify()
      return
    }
  }

  /** Update context for an existing holder (e.g. `activateOn="mount"` when props change). */
  updateScopeHolderContext(holderId: number, ctx: Record<string, unknown>): void {
    for (const [scope, holders] of this.scopeHolderStacks) {
      const h = holders.find(x => x.id === holderId)
      if (!h) continue
      h.ctx = ctx
      const top = holders[holders.length - 1]
      if (top.id === holderId) {
        this.scopeContexts.set(scope, ctx)
        this.notify()
      }
      return
    }
  }

  getActiveScopes(): string[] {
    const cacheKey = 'activeScopes'
    const cached = this.cache.get(cacheKey)
    if (cached && cached.version === this.version) return cached.result as string[]

    const result = [...this.scopeStack]
    this.cache.set(cacheKey, { version: this.version, result })
    return result
  }

  getActiveScopeContexts(): Map<string, Record<string, unknown>> {
    return new Map(this.scopeContexts)
  }

  /** Clone active stack + contexts for palette / menu pinning (see `ActiveScopeSnapshot`). */
  getActiveScopeSnapshot(): ActiveScopeSnapshot {
    const scopes = this.getActiveScopes()
    const contexts = this.getActiveScopeContexts()
    return {
      scopes: scopes.slice(),
      contexts: new Map(contexts),
    }
  }

  /**
   * Capture the current active scope snapshot (call synchronously when opening a command
   * surface). Subsequent `getActiveScopeSnapshot()` for shortcuts still reflects live state;
   * use {@link getActiveScopeSnapshotPin} for palette filtering until {@link clearActiveScopeSnapshotPin}.
   */
  pinActiveScopeSnapshot(): void {
    this.activeScopeSnapshotPin = this.getActiveScopeSnapshot()
    this.notify()
  }

  clearActiveScopeSnapshotPin(): void {
    if (this.activeScopeSnapshotPin === null) return
    this.activeScopeSnapshotPin = null
    this.notify()
  }

  getActiveScopeSnapshotPin(): ActiveScopeSnapshot | null {
    return this.activeScopeSnapshotPin
  }

  // -------------------------------------------------------------------------
  // Execution
  // -------------------------------------------------------------------------

  async execute(id: string, args?: ExecuteArgs): Promise<void> {
    const internal = this.commands.get(id)
    if (!internal) return

    const resolved = this.resolve(internal)
    if (!resolved.visible || resolved.disabled || resolved.pending) return

    if (isParentCommand(internal.definition)) return

    this.pendingCommands.add(id)
    this.notify()

    try {
      const ctx = this.getMergedContext(internal)

      if (isRadioCommand(internal.definition)) {
        await internal.definition.handler({
          ctx,
          value: args?.value ?? '',
          skipConfirm: args?.skipConfirm,
        } as { ctx: Record<string, unknown>; value: string } & ExecuteArgs)
      } else if (!isParentCommand(internal.definition)) {
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
        const scopeIdx = internal.scope
          ? this.scopeStack.indexOf(internal.scope)
          : null

        bindings.push({
          commandId: internal.id,
          shortcut: normalizeShortcut(shortcut, this.platform),
          scope: internal.scope,
          scopeDepth: scopeIdx !== null && scopeIdx !== -1 ? scopeIdx : null,
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

    // Group by scope for same-scope collision detection
    const byScope = new Map<string | null, ShortcutBinding[]>()
    for (const b of bindings) {
      const key = b.scope ?? '__global__'
      const group = byScope.get(key) ?? []
      group.push(b)
      byScope.set(key, group)
    }

    // Same-scope collisions
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
              `⚠️ [commandry] Shortcut collision: '${aStr}' in scope '${scopeLabel}'\n` +
              `  → '${a.commandId}'\n` +
              `  → '${b.commandId}'\n` +
              `  Last registered wins.`,
            )
          }
        }
      }
    }

    // Parent-scope shadowing
    for (const binding of bindings) {
      if (binding.scope === null || binding.shadow) continue

      for (const other of bindings) {
        if (other === binding) continue
        if (other.scope === null) continue
        if (other.scope === binding.scope) continue

        const bStr = shortcutToString(binding.shortcut, this.platform)
        const oStr = shortcutToString(other.shortcut, this.platform)
        if (bStr !== oStr) continue

        if (isAncestorOf(this.scopeTree, other.scope, binding.scope)) {
          console.warn(
            `⚠️ [commandry] Shortcut shadowing: '${bStr}'\n` +
            `  → '${binding.commandId}' (scope: ${binding.scope})\n` +
            `  → '${other.commandId}' (scope: ${other.scope}, ancestor)\n` +
            `  Inner scope takes priority. Add { shadow: true } if intentional.`,
          )
        }
      }
    }

    // Prefix collisions
    for (const [, scopeBindings] of byScope) {
      const singles = scopeBindings.filter(b => b.shortcut.length === 1)
      const sequences = scopeBindings.filter(b => b.shortcut.length > 1)

      for (const single of singles) {
        const sStr = shortcutToString(single.shortcut, this.platform)
        for (const seq of sequences) {
          const firstStep = shortcutToString([seq.shortcut[0]], this.platform)
          if (sStr === firstStep) {
            console.warn(
              `⚠️ [commandry] Prefix collision in scope '${single.scope ?? 'global'}':\n` +
              `  '${sStr}' is both a complete shortcut (${single.commandId}) and\n` +
              `  the start of a sequence (${seq.commandId}: ${shortcutToString(seq.shortcut, this.platform)})\n` +
              `  ${single.commandId} will never fire.`,
            )
          }
        }
      }
    }
  }

  getScopeDepth(scope: string | null): number {
    if (!scope) return -1
    let depth = 0
    let node = this.scopeTree.nodes.get(scope) ?? null
    while (node?.parent) {
      depth++
      node = node.parent
    }
    return depth
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

  private resolve(internal: InternalCommand): ResolvedCommand {
    const def = internal.definition
    const ctx = this.getMergedContext(internal)
    const ctxArg = { ctx }

    const label = typeof def.label === 'function' ? def.label(ctxArg) : def.label

    let icon: ComponentType | undefined
    if (isParentCommand(def)) {
      icon = def.icon
    } else if ('icon' in def && def.icon != null) {
      const iconField = def.icon
      if (typeof iconField === 'function') {
        const result = (iconField as (args: { ctx: Record<string, unknown> }) => ComponentType)(ctxArg)
        icon = result
      } else {
        icon = iconField as ComponentType
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

    const customProps: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(def)) {
      if (!KNOWN_KEYS.has(key)) {
        customProps[key] = value
      }
    }

    const resolved: ResolvedCommand = {
      id: internal.id,
      label,
      icon,
      description: 'description' in def ? def.description : undefined,
      group: this.resolveGroup(def, ctxArg),
      scope: internal.scope,
      keywords: ('keywords' in def && def.keywords) ? def.keywords as string[] : [],
      priority: ('priority' in def && def.priority != null) ? def.priority as number : 0,
      danger: ('danger' in def && def.danger === true),
      variant: ('variant' in def ? def.variant : undefined) as string | undefined,
      shortcut: ('shortcut' in def ? def.shortcut : undefined) as ShortcutField | undefined,
      visible: when,
      disabled: !enabled,
      pending: this.pendingCommands.has(internal.id),
      kind,
      children: isParentCommand(def),
      childIds,
      checked: isToggleCommand(def) ? () => def.checked(ctxArg) : undefined,
      value: isRadioCommand(def) ? () => def.value(ctxArg) : undefined,
      options: isRadioCommand(def) ? def.options : undefined,
      execute: (args?: ExecuteArgs) => this.execute(internal.id, args),
      bulkAction:
        'bulkAction' in def ? (def as BaseCommandDefinition).bulkAction : undefined,
      ...customProps,
    }

    return resolved
  }

  private getMergedContext(internal: InternalCommand): Record<string, unknown> {
    const registrationCtx = this.registrationContexts.get(internal.id) ?? {}
    const scopeCtx = mergeContext(this.scopeStack, this.scopeContexts)
    return { ...registrationCtx, ...scopeCtx }
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
