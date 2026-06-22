import { describe, expect, it } from 'vitest'
import { buildContextMenuModel } from './context-menu-model'
import type { ActiveContext } from '../dom/resolve-active-context'
import type { ResolvedCommand } from './types'

function cmd(
  partial: Pick<ResolvedCommand, 'id' | 'scope' | 'label'> & Partial<ResolvedCommand>,
): ResolvedCommand {
  return {
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

function ctx(regions: string[], anchors: Record<string, string> = {}): ActiveContext {
  return { regions, anchors, ctx: {}, element: null }
}

describe('buildContextMenuModel', () => {
  it('includes commands for the menu region', () => {
    const commands = [cmd({ id: 'a', scope: 'app', label: 'Global' })]
    const model = buildContextMenuModel({
      commands,
      context: ctx(['app', 'item']),
    })
    expect(model.empty).toBe(false)
    expect([...model.groups.get('Actions')!].map(c => c.id)).toEqual(['a'])
  })

  it('prefers bulkAction commands when bulkSelectionActive', () => {
    const commands = [
      cmd({ id: 'row', scope: 'thread-item', label: 'Archive', bulkAction: false }),
      cmd({ id: 'list', scope: 'thread-item', label: 'Archive', bulkAction: true }),
    ]
    const model = buildContextMenuModel({
      commands,
      context: ctx(['thread-item']),
      bulkSelectionActive: true,
      bulkRegion: 'thread-item',
    })
    const items = [...model.groups.values()].flat()
    expect(items).toHaveLength(1)
    expect(items[0]!.id).toBe('list')
  })

  it('dedupes by group and label', () => {
    const commands = [
      cmd({ id: 'a', scope: 'app', label: 'Same', group: 'G' }),
      cmd({ id: 'b', scope: 'app', label: 'Same', group: 'G' }),
    ]
    const model = buildContextMenuModel({
      commands,
      context: ctx(['app']),
    })
    const items = model.groups.get('G') ?? []
    expect(items).toHaveLength(1)
  })

  it('filters thread-item commands to anchor threadId when not bulk', () => {
    const commands = [
      cmd({
        id: 'thread.t1.archive',
        scope: 'thread-item',
        label: 'Archive',
        group: 'Thread',
      }),
      cmd({
        id: 'thread.t2.archive',
        scope: 'thread-item',
        label: 'Archive',
        group: 'Thread',
      }),
    ]
    const model = buildContextMenuModel({
      commands,
      context: ctx(['thread-item'], { threadId: 't2' }),
      bulkSelectionActive: false,
    })
    const items = [...model.groups.values()].flat()
    expect(items.map(c => c.id)).toEqual(['thread.t2.archive'])
  })
})
