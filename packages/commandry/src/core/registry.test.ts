import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandRegistry } from './registry'
import type { CommandDefinitionMap } from './types'

function makeCommands(overrides?: Partial<Record<string, unknown>>): CommandDefinitionMap {
  return {
    'test.action': {
      label: 'Test Action',
      group: 'Test',
      keywords: ['demo'],
      handler: vi.fn(),
      ...overrides,
    },
  }
}

describe('CommandRegistry', () => {
  let registry: CommandRegistry

  beforeEach(() => {
    registry = new CommandRegistry()
  })

  describe('register / unregister', () => {
    it('registers commands and exposes them via getCommand', () => {
      registry.register(makeCommands())
      const cmd = registry.getCommand('test.action')
      expect(cmd).not.toBeNull()
      expect(cmd!.label).toBe('Test Action')
      expect(cmd!.group).toBe('Test')
    })

    it('returns a cleanup function that unregisters', () => {
      const cleanup = registry.register(makeCommands())
      expect(registry.getCommand('test.action')).not.toBeNull()
      cleanup()
      expect(registry.getCommand('test.action')).toBeNull()
    })

    it('returns null for unknown IDs', () => {
      expect(registry.getCommand('nope')).toBeNull()
    })

    it('last-write-wins on duplicate IDs', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      registry.register({ 'dup': { label: 'First', handler: vi.fn() } })
      registry.register({ 'dup': { label: 'Second', handler: vi.fn() } })
      expect(registry.getCommand('dup')!.label).toBe('Second')
      warnSpy.mockRestore()
    })

    it('registers parent commands with children using dotted IDs', () => {
      registry.register({
        'edit.turnInto': {
          label: 'Turn into',
          children: {
            'h1': { label: 'Heading 1', handler: vi.fn() },
            'h2': { label: 'Heading 2', handler: vi.fn() },
          },
        },
      })

      expect(registry.getCommand('edit.turnInto')).not.toBeNull()
      expect(registry.getCommand('edit.turnInto.h1')).not.toBeNull()
      expect(registry.getCommand('edit.turnInto.h2')).not.toBeNull()
    })
  })

  describe('getCommands with filter', () => {
    beforeEach(() => {
      registry.register({
        'file.save': { label: 'Save', group: 'File', handler: vi.fn() },
        'file.open': { label: 'Open', group: 'File', handler: vi.fn() },
        'edit.copy': { label: 'Copy', group: 'Edit', handler: vi.fn() },
      })
    })

    it('returns all commands when no filter', () => {
      expect(registry.getCommands()).toHaveLength(3)
    })

    it('filters by group', () => {
      const fileCmds = registry.getCommands({ group: 'File' })
      expect(fileCmds).toHaveLength(2)
      expect(fileCmds.every(c => c.group === 'File')).toBe(true)
    })

    it('filters by scope', () => {
      registry.register({
        'scoped': { label: 'Scoped', scope: 'editor', handler: vi.fn() },
      })
      expect(registry.getCommands({ scope: 'editor' })).toHaveLength(1)
    })
  })

  describe('getChildren', () => {
    it('returns child commands', () => {
      registry.register({
        'parent': {
          label: 'Parent',
          children: {
            'a': { label: 'Child A', handler: vi.fn() },
            'b': { label: 'Child B', handler: vi.fn() },
          },
        },
      })

      const children = registry.getChildren('parent')
      expect(children).toHaveLength(2)
      expect(children.map(c => c.id).sort()).toEqual(['parent.a', 'parent.b'])
    })
  })

  describe('search', () => {
    beforeEach(() => {
      registry.register({
        'task.create': {
          label: 'New Task',
          description: 'Create a brand new task',
          keywords: ['add', 'todo'],
          handler: vi.fn(),
        },
        'task.delete': {
          label: 'Delete Task',
          keywords: ['remove'],
          handler: vi.fn(),
        },
        'hidden': {
          label: 'Hidden Command',
          when: () => false,
          handler: vi.fn(),
        },
      })
    })

    it('finds by label prefix', () => {
      const results = registry.search('New')
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].id).toBe('task.create')
    })

    it('finds by keyword', () => {
      const results = registry.search('remove')
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].id).toBe('task.delete')
    })

    it('finds by description', () => {
      const results = registry.search('brand new')
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].id).toBe('task.create')
    })

    it('excludes commands where when() returns false', () => {
      const results = registry.search('Hidden')
      expect(results).toHaveLength(0)
    })

    it('returns all commands when query is empty', () => {
      const results = registry.search('')
      expect(results.length).toBe(3)
    })
  })

  describe('execute', () => {
    it('calls handler with context', async () => {
      const handler = vi.fn()
      registry.register({ 'cmd': { label: 'Cmd', handler } })
      await registry.execute('cmd')
      expect(handler).toHaveBeenCalledOnce()
    })

    it('is a no-op when visible=false', async () => {
      const handler = vi.fn()
      registry.register({ 'cmd': { label: 'Cmd', when: () => false, handler } })
      await registry.execute('cmd')
      expect(handler).not.toHaveBeenCalled()
    })

    it('is a no-op when disabled', async () => {
      const handler = vi.fn()
      registry.register({ 'cmd': { label: 'Cmd', enabled: () => false, handler } })
      await registry.execute('cmd')
      expect(handler).not.toHaveBeenCalled()
    })

    it('sets pending while async handler is in-flight', async () => {
      let resolveFn: () => void
      const handler = vi.fn(() => new Promise<void>(r => { resolveFn = r }))
      registry.register({ 'cmd': { label: 'Cmd', handler } })

      const promise = registry.execute('cmd')
      expect(registry.getCommand('cmd')!.pending).toBe(true)

      resolveFn!()
      await promise
      expect(registry.getCommand('cmd')!.pending).toBe(false)
    })

    it('clears pending after handler rejects', async () => {
      const handler = vi.fn(() => Promise.reject(new Error('fail')))
      registry.register({ 'cmd': { label: 'Cmd', handler } })

      await registry.execute('cmd').catch(() => {})
      expect(registry.getCommand('cmd')!.pending).toBe(false)
    })

    it('is a no-op while pending', async () => {
      let resolveFn: () => void
      const handler = vi.fn(() => new Promise<void>(r => { resolveFn = r }))
      registry.register({ 'cmd': { label: 'Cmd', handler } })

      const p1 = registry.execute('cmd')
      await registry.execute('cmd') // should be no-op
      expect(handler).toHaveBeenCalledTimes(1)

      resolveFn!()
      await p1
    })

    it('passes value for radio commands', async () => {
      const handler = vi.fn()
      registry.register({
        'theme': {
          label: 'Theme',
          kind: 'radio',
          options: [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }],
          value: () => 'light',
          handler,
        },
      })

      await registry.execute('theme', { value: 'dark' })
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ value: 'dark' }))
    })
  })

  describe('scope management', () => {
    it('pushScope / popScope maintain the stack', () => {
      registry.pushScope('page', { pageId: '1' })
      registry.pushScope('list', { listId: 'a' })

      expect(registry.getActiveScopes()).toEqual(['page', 'list'])

      registry.popScope('list')
      expect(registry.getActiveScopes()).toEqual(['page'])
    })

    it('allows multiple holders for the same scope name (ref-counted)', () => {
      registry.pushScope('item', { itemId: 'pane' })
      expect(registry.getActiveScopes()).toEqual(['item'])

      registry.pushScope('item', { itemId: 'row' })
      expect(registry.getActiveScopes()).toEqual(['item'])
      expect(registry.getActiveScopeContexts().get('item')).toEqual({ itemId: 'row' })

      registry.popScope('item')
      expect(registry.getActiveScopes()).toEqual(['item'])
      expect(registry.getActiveScopeContexts().get('item')).toEqual({ itemId: 'pane' })

      registry.popScope('item')
      expect(registry.getActiveScopes()).toEqual([])
    })

    it('removeScopeHolder drops a specific holder without popping the active one', () => {
      const idPane = registry.pushScope('item', { itemId: 'pane' })
      registry.pushScope('item', { itemId: 'row' })
      expect(registry.getActiveScopeContexts().get('item')).toEqual({ itemId: 'row' })
      registry.removeScopeHolder(idPane)
      expect(registry.getActiveScopes()).toEqual(['item'])
      expect(registry.getActiveScopeContexts().get('item')).toEqual({ itemId: 'row' })
    })

    it('updateScopeHolderContext updates the active context when that holder is on top', () => {
      const id = registry.pushScope('page', { pageId: '1' })
      registry.updateScopeHolderContext(id, { pageId: '2' })
      expect(registry.getActiveScopeContexts().get('page')).toEqual({ pageId: '2' })
    })

    it('updateScopeHolderContext on a buried holder leaves the active context unchanged', () => {
      const idPane = registry.pushScope('item', { itemId: 'pane' })
      registry.pushScope('item', { itemId: 'row' })
      registry.updateScopeHolderContext(idPane, { itemId: 'pane-updated' })
      expect(registry.getActiveScopeContexts().get('item')).toEqual({ itemId: 'row' })
    })

    it('getActiveScopeSnapshot is a detached copy of stack and contexts', () => {
      registry.pushScope('item', { itemId: 'a' })
      const snap = registry.getActiveScopeSnapshot()
      expect(snap.scopes).toEqual(['item'])
      expect(snap.contexts.get('item')).toEqual({ itemId: 'a' })
      registry.popScope('item')
      expect(registry.getActiveScopes()).toEqual([])
      expect(snap.scopes).toEqual(['item'])
      expect(snap.contexts.get('item')).toEqual({ itemId: 'a' })
    })

    it('pinActiveScopeSnapshot freezes until clearActiveScopeSnapshotPin', () => {
      expect(registry.getActiveScopeSnapshotPin()).toBeNull()
      registry.pushScope('item', { itemId: 'pinned' })
      registry.pinActiveScopeSnapshot()
      const pin = registry.getActiveScopeSnapshotPin()
      expect(pin?.scopes).toEqual(['item'])
      registry.popScope('item')
      expect(registry.getActiveScopes()).toEqual([])
      expect(registry.getActiveScopeSnapshotPin()?.scopes).toEqual(['item'])
      registry.clearActiveScopeSnapshotPin()
      expect(registry.getActiveScopeSnapshotPin()).toBeNull()
    })

    it('merges context from scope stack into handler', async () => {
      const handler = vi.fn()
      registry.pushScope('page', { pageId: '1' })
      registry.pushScope('item', { itemId: '42' })

      registry.register({ 'cmd': { label: 'Cmd', handler } })
      await registry.execute('cmd')

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({ pageId: '1', itemId: '42' }),
        }),
      )
    })
  })

  describe('subscribe', () => {
    it('calls listener on changes', () => {
      const listener = vi.fn()
      registry.subscribe(listener)
      registry.register(makeCommands())
      expect(listener).toHaveBeenCalled()
    })

    it('returns unsubscribe function', () => {
      const listener = vi.fn()
      const unsub = registry.subscribe(listener)
      unsub()
      registry.register(makeCommands())
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('resolved command shape', () => {
    it('resolves toggle commands', () => {
      let checked = false
      registry.register({
        'toggle': {
          label: 'Toggle',
          kind: 'toggle',
          checked: () => checked,
          handler: vi.fn(),
        },
      })

      const cmd = registry.getCommand('toggle')!
      expect(cmd.kind).toBe('toggle')
      expect(cmd.checked).toBeDefined()
      expect(cmd.checked!()).toBe(false)

      checked = true
      const cmd2 = registry.getCommand('toggle')!
      expect(cmd2.checked!()).toBe(true)
    })

    it('resolves radio commands', () => {
      registry.register({
        'radio': {
          label: 'Radio',
          kind: 'radio',
          options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
          value: () => 'a',
          handler: vi.fn(),
        },
      })

      const cmd = registry.getCommand('radio')!
      expect(cmd.kind).toBe('radio')
      expect(cmd.options).toHaveLength(2)
      expect(cmd.value!()).toBe('a')
    })

    it('resolves parent commands', () => {
      registry.register({
        'parent': {
          label: 'Parent',
          children: {
            'child': { label: 'Child', handler: vi.fn() },
          },
        },
      })

      const cmd = registry.getCommand('parent')!
      expect(cmd.kind).toBe('parent')
      expect(cmd.children).toBe(true)
      expect(cmd.childIds).toEqual(['parent.child'])
    })

    it('spreads custom properties', () => {
      registry.register({
        'custom': {
          label: 'Custom',
          handler: vi.fn(),
          requiredRole: 'admin',
          analytics: 'custom_event',
        } as any,
      })

      const cmd = registry.getCommand('custom')!
      expect(cmd.requiredRole).toBe('admin')
      expect(cmd.analytics).toBe('custom_event')
    })
  })

  describe('scope tree dev warnings', () => {
    it('warns when pushing an unknown scope name', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const r = new CommandRegistry({
        scopes: {
          page: { children: { 'task-list': { children: { 'task-item': {} } } } },
        },
      })
      r.pushScope('not-in-tree', {})
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown scope 'not-in-tree'"),
      )
      warnSpy.mockRestore()
    })

    it('warns when two active scopes are incomparable in the tree', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const r = new CommandRegistry({
        scopes: {
          page: {
            children: {
              'task-list': { children: { 'task-item': {} } },
              canvas: { children: { 'canvas-node': {} } },
            },
          },
        },
      })
      r.pushScope('task-list', {})
      r.pushScope('canvas-node', {})
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Incompatible active scopes'),
      )
      warnSpy.mockRestore()
    })
  })
})
