import { describe, expect, it, vi } from 'vitest'
import { prepareCommandPaletteRows } from './palette-rows'
import type { ActiveContext } from '../dom/resolve-active-context'
import type { ResolvedCommand } from './types'

function action(
  id: string,
  scope: string | null,
  opts?: Partial<ResolvedCommand>,
): ResolvedCommand {
  return {
    id,
    label: id,
    description: undefined,
    keywords: [],
    priority: 0,
    danger: false,
    variant: undefined,
    shortcut: undefined,
    visible: true,
    disabled: false,
    pending: false,
    kind: 'action',
    scope,
    children: false,
    childIds: [],
    execute: vi.fn(),
    ...opts,
  } as ResolvedCommand
}

function radio(id: string, scope: string | null): ResolvedCommand {
  return {
    id,
    label: 'Label',
    description: undefined,
    keywords: [],
    priority: 0,
    danger: false,
    variant: undefined,
    shortcut: undefined,
    visible: true,
    disabled: false,
    pending: false,
    kind: 'radio',
    scope,
    children: false,
    childIds: [],
    options: [{ id: 'x', label: 'X' }],
    value: () => 'x',
    execute: vi.fn(),
  } as ResolvedCommand
}

const context = (regions: string[]): ActiveContext => ({
  regions,
  anchors: {},
  ctx: {},
  element: null,
})

describe('prepareCommandPaletteRows', () => {
  it('sorts deeper region before shallower', () => {
    const rows = prepareCommandPaletteRows(
      [action('a', 'shallow'), action('b', 'deep')],
      { context: context(['app', 'shallow', 'deep']) },
    )
    expect(rows.map(r => r.id)).toEqual(['b', 'a'])
  })

  it('emits one row per radio with radioCommandId', () => {
    const rows = prepareCommandPaletteRows([radio('r1', 'app')], {
      context: context(['app']),
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.radioCommandId).toBe('r1')
    expect(rows[0]!.run).toBeUndefined()
  })

  it('in multiSelectMode drops non-bulk thread-item commands', () => {
    const rows = prepareCommandPaletteRows(
      [
        action('single', 'thread-item', { bulkAction: false }),
        action('bulk', 'thread-item', { bulkAction: true }),
      ],
      { context: context(['thread-item']), multiSelectMode: true },
    )
    expect(rows.map(r => r.id)).toEqual(['bulk'])
  })

  it('run catches async execute rejections', async () => {
    const error = new Error('palette boom')
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cmd = action('explode', null, {
      execute: vi.fn().mockRejectedValue(error),
    })

    const rows = prepareCommandPaletteRows([cmd], { context: context([]) })
    rows[0]?.run?.()
    await Promise.resolve()

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith("[commandry] Command 'explode' failed", error)
    consoleErrorSpy.mockRestore()
  })
})
