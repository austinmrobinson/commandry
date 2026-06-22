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

  describe('context and modes', () => {
    it('setLiveContext merges into handler ctx', async () => {
      const handler = vi.fn()
      registry.setLiveContext({
        regions: ['page', 'item'],
        anchors: {},
        ctx: { pageId: '1', itemId: '42' },
        element: null,
      })
      registry.register({ 'cmd': { label: 'Cmd', handler } })
      await registry.execute('cmd')
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({ pageId: '1', itemId: '42' }),
        }),
      )
    })

    it('pinContext overrides live context until cleared', () => {
      registry.setLiveContext({
        regions: ['live'],
        anchors: {},
        ctx: { from: 'live' },
        element: null,
      })
      registry.pinContext({
        regions: ['pinned'],
        anchors: {},
        ctx: { from: 'pinned' },
        element: null,
      })
      expect(registry.getEffectiveContext().regions).toEqual(['pinned'])
      registry.clearContextPin()
      expect(registry.getEffectiveContext().regions).toEqual(['live'])
    })

    it('setModes stores active modes', () => {
      registry.setModes(['bulk', 'palette'])
      expect(registry.getModes()).toEqual(new Set(['bulk', 'palette']))
    })

    it('getRegionDepth uses context region index', () => {
      const ctx = {
        regions: ['app', 'thread-item'],
        anchors: {},
        ctx: {},
        element: null,
      }
      expect(registry.getRegionDepth('thread-item', ctx)).toBe(1)
      expect(registry.getRegionDepth('app', ctx)).toBe(0)
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

  })
})
