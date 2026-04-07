import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SequenceEngine } from './sequence'
import type { ShortcutBinding } from './types'

function createKeyEvent(
  key: string,
  mods: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: mods.ctrl ?? false,
    altKey: mods.alt ?? false,
    shiftKey: mods.shift ?? false,
    metaKey: mods.meta ?? false,
    cancelable: true,
  })
}

function makeBinding(
  commandId: string,
  shortcut: string[][],
  opts?: Partial<ShortcutBinding>,
): ShortcutBinding {
  return {
    commandId,
    shortcut,
    scope: null,
    scopeDepth: null,
    shadow: false,
    external: false,
    registeredAt: Date.now(),
    ...opts,
  }
}

describe('SequenceEngine', () => {
  let engine: SequenceEngine

  beforeEach(() => {
    vi.useFakeTimers()
    engine = new SequenceEngine({ platform: 'mac', timeout: 800 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes single-step shortcuts immediately', () => {
    const execute = vi.fn()
    const bindings = [makeBinding('save', [['meta', 's']])]
    const event = createKeyEvent('s', { meta: true })

    const handled = engine.handleKeyDown(event, bindings, execute)
    expect(handled).toBe(true)
    expect(execute).toHaveBeenCalledWith('save')
  })

  it('enters sequence mode for multi-step shortcuts', () => {
    const execute = vi.fn()
    const bindings = [makeBinding('go-inbox', [['g'], ['i']])]
    const event = createKeyEvent('g')

    const handled = engine.handleKeyDown(event, bindings, execute)
    expect(handled).toBe(true)
    expect(execute).not.toHaveBeenCalled()

    const state = engine.getState()
    expect(state.buffer).toHaveLength(1)
    expect(state.pending).toHaveLength(1)
  })

  it('completes sequence on matching second step', () => {
    const execute = vi.fn()
    const bindings = [makeBinding('go-inbox', [['g'], ['i']])]

    engine.handleKeyDown(createKeyEvent('g'), bindings, execute)
    engine.handleKeyDown(createKeyEvent('i'), bindings, execute)

    expect(execute).toHaveBeenCalledWith('go-inbox')
    expect(engine.getState().buffer).toHaveLength(0)
  })

  it('resets on wrong second step', () => {
    const execute = vi.fn()
    const bindings = [makeBinding('go-inbox', [['g'], ['i']])]

    engine.handleKeyDown(createKeyEvent('g'), bindings, execute)
    const handled = engine.handleKeyDown(createKeyEvent('x'), bindings, execute)

    expect(handled).toBe(false)
    expect(execute).not.toHaveBeenCalled()
    expect(engine.getState().buffer).toHaveLength(0)
  })

  it('resets on timeout', () => {
    const execute = vi.fn()
    const bindings = [makeBinding('go-inbox', [['g'], ['i']])]

    engine.handleKeyDown(createKeyEvent('g'), bindings, execute)
    expect(engine.getState().buffer).toHaveLength(1)

    vi.advanceTimersByTime(900)
    expect(engine.getState().buffer).toHaveLength(0)
  })

  it('sequence mode takes priority over single-step matches (prefix collision)', () => {
    const execute = vi.fn()
    const bindings = [
      makeBinding('single-g', [['g']]),
      makeBinding('go-inbox', [['g'], ['i']]),
    ]

    engine.handleKeyDown(createKeyEvent('g'), bindings, execute)
    expect(execute).not.toHaveBeenCalled() // sequence takes priority
  })

  it('resolves deepest scope when multiple bindings match', () => {
    const execute = vi.fn()
    const bindings = [
      makeBinding('outer-save', [['meta', 's']], { scope: 'page', scopeDepth: 0 }),
      makeBinding('inner-save', [['meta', 's']], { scope: 'item', scopeDepth: 1 }),
    ]

    engine.handleKeyDown(createKeyEvent('s', { meta: true }), bindings, execute)
    expect(execute).toHaveBeenCalledWith('inner-save')
  })

  it('prefers bulkAction bindings when preferBulkShortcuts is true', () => {
    const execute = vi.fn()
    const now = Date.now()
    const bindings = [
      makeBinding('row-archive', [['e']], {
        scope: 'thread-item',
        scopeDepth: 2,
        registeredAt: now + 1,
        bulkAction: false,
      }),
      makeBinding('list-archive', [['e']], {
        scope: 'thread-list',
        scopeDepth: 1,
        registeredAt: now,
        bulkAction: true,
      }),
    ]

    engine.handleKeyDown(createKeyEvent('e'), bindings, execute, {
      preferBulkShortcuts: true,
    })
    expect(execute).toHaveBeenCalledWith('list-archive')
  })

  it('resolves last-registered when same scope depth', () => {
    const execute = vi.fn()
    const now = Date.now()
    const bindings = [
      makeBinding('first', [['meta', 's']], { registeredAt: now }),
      makeBinding('second', [['meta', 's']], { registeredAt: now + 1 }),
    ]

    engine.handleKeyDown(createKeyEvent('s', { meta: true }), bindings, execute)
    expect(execute).toHaveBeenCalledWith('second')
  })

  it('notifies subscribers on state changes', () => {
    const listener = vi.fn()
    engine.subscribe(listener)

    const bindings = [makeBinding('go-inbox', [['g'], ['i']])]
    engine.handleKeyDown(createKeyEvent('g'), bindings, vi.fn())

    expect(listener).toHaveBeenCalled()
  })

  it('unsubscribes correctly', () => {
    const listener = vi.fn()
    const unsub = engine.subscribe(listener)
    unsub()

    const bindings = [makeBinding('go-inbox', [['g'], ['i']])]
    engine.handleKeyDown(createKeyEvent('g'), bindings, vi.fn())

    expect(listener).not.toHaveBeenCalled()
  })

  it('handles shared-prefix sequences correctly', () => {
    const execute = vi.fn()
    const bindings = [
      makeBinding('go-inbox', [['g'], ['i']]),
      makeBinding('go-sent', [['g'], ['s']]),
    ]

    engine.handleKeyDown(createKeyEvent('g'), bindings, execute)
    expect(engine.getState().pending).toHaveLength(2)

    engine.handleKeyDown(createKeyEvent('s'), bindings, execute)
    expect(execute).toHaveBeenCalledWith('go-sent')
  })

  it('ignores pure modifier keypresses', () => {
    const execute = vi.fn()
    const bindings = [makeBinding('save', [['meta', 's']])]

    const event = new KeyboardEvent('keydown', {
      key: 'Meta',
      metaKey: true,
      cancelable: true,
    })

    const handled = engine.handleKeyDown(event, bindings, execute)
    expect(handled).toBe(false)
  })
})
