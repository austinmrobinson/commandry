import { describe, expect, it } from 'vitest'
import type { ActiveContext } from '../dom/resolve-active-context'
import type { ResolvedCommand } from './types'
import { filterCommandsForSurface } from './filter-commands-for-surface'

function cmd(
  partial: Pick<ResolvedCommand, 'id' | 'scope'> & Partial<ResolvedCommand>,
): ResolvedCommand {
  return {
    label: partial.id,
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
    children: false,
    childIds: [],
    execute: async () => {},
    ...partial,
  } as ResolvedCommand
}

function activation(
  regions: string[],
  anchors: Record<string, string> = {},
): ActiveContext {
  return { regions, anchors, ctx: {}, element: null }
}

describe('filterCommandsForSurface', () => {
  it('keeps global (null scope) commands', () => {
    const commands = [cmd({ id: 'g', scope: null })]
    const snap = activation(['app'])
    expect(filterCommandsForSurface(commands, snap, { selectedThreadIds: [], selectedThreadId: null }))
      .toHaveLength(1)
  })

  it('filters thread-item to active thread when single-select', () => {
    const commands = [
      cmd({ id: 'thread.t1.archive', scope: 'thread-item' }),
      cmd({ id: 'thread.t2.archive', scope: 'thread-item' }),
    ]
    const snap = activation(['app', 'thread-list', 'thread-item'], { threadId: 't1' })
    const out = filterCommandsForSurface(commands, snap, {
      selectedThreadIds: [],
      selectedThreadId: 't1',
    })
    expect(out.map(c => c.id)).toEqual(['thread.t1.archive'])
  })

  it('hides non-bulk thread-item commands in multi-select', () => {
    const commands = [cmd({ id: 'thread.t1.archive', scope: 'thread-item', bulkAction: true })]
    const snap = activation(['thread-list', 'thread-item'], { threadId: 't1' })
    expect(
      filterCommandsForSurface(commands, snap, {
        selectedThreadIds: ['t1', 't2'],
        selectedThreadId: 't1',
      }),
    ).toHaveLength(1)
  })

  it('keeps thread-list in multi-select', () => {
    const commands = [cmd({ id: 'threadList.archive', scope: 'thread-list', bulkAction: true })]
    const snap = activation(['thread-list'])
    expect(
      filterCommandsForSurface(commands, snap, {
        selectedThreadIds: ['t1'],
        selectedThreadId: null,
      }),
    ).toHaveLength(1)
  })

  it('hides thread-list when thread-item is active in single-select', () => {
    const commands = [
      cmd({ id: 'threadList.archive', scope: 'thread-list', bulkAction: true }),
      cmd({ id: 'thread.t1.archive', scope: 'thread-item' }),
    ]
    const snap = activation(['thread-list', 'thread-item'], { threadId: 't1' })
    const out = filterCommandsForSurface(commands, snap, {
      selectedThreadIds: [],
      selectedThreadId: 't1',
    })
    expect(out.map(c => c.id)).toEqual(['thread.t1.archive'])
  })

  it('filters message commands by message id', () => {
    const commands = [
      cmd({ id: 'message.m1.copy', scope: 'message' }),
      cmd({ id: 'message.m2.copy', scope: 'message' }),
    ]
    const snap = activation(['message'], { messageId: 'm1', threadId: 't1' })
    expect(
      filterCommandsForSurface(commands, snap, {
        selectedThreadIds: [],
        selectedThreadId: 't1',
      }).map(c => c.id),
    ).toEqual(['message.m1.copy'])
  })
})
