import { describe, expect, it } from 'vitest'
import { buildScopeTree } from './scope'
import { buildContextMenuModelFromScope } from './context-menu-model'
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

const tree = buildScopeTree({
  app: { children: { item: {} } },
})

describe('buildContextMenuModelFromScope', () => {
  it('walks to parent scope when direct scope has no commands', () => {
    const commands = [cmd({ id: 'a', scope: 'app', label: 'Global' })]
    const model = buildContextMenuModelFromScope({
      commands,
      menuScope: 'item',
      scopeTree: tree,
    })
    expect(model.empty).toBe(false)
    expect([...model.groups.get('Actions')!].map(c => c.id)).toEqual(['a'])
  })

  it('prefers bulkAction commands when bulkSelectionActive', () => {
    const commands = [
      cmd({ id: 'row', scope: 'thread-item', label: 'Archive', bulkAction: false }),
      cmd({ id: 'list', scope: 'thread-item', label: 'Archive', bulkAction: true }),
    ]
    const itemTree = buildScopeTree({
      app: { children: { 'thread-item': {} } },
    })
    const model = buildContextMenuModelFromScope({
      commands,
      menuScope: 'thread-item',
      scopeTree: itemTree,
      bulkSelectionActive: true,
      bulkScopedLayer: 'thread-item',
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
    const model = buildContextMenuModelFromScope({
      commands,
      menuScope: 'app',
      scopeTree: tree,
    })
    const items = model.groups.get('G') ?? []
    expect(items).toHaveLength(1)
  })

  it('filters thread-item commands to menuAnchorThreadId when not bulk', () => {
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
    const itemTree = buildScopeTree({
      app: { children: { 'thread-item': {} } },
    })
    const model = buildContextMenuModelFromScope({
      commands,
      menuScope: 'thread-item',
      scopeTree: itemTree,
      bulkSelectionActive: false,
      menuAnchorThreadId: 't2',
    })
    const items = [...model.groups.values()].flat()
    expect(items.map(c => c.id)).toEqual(['thread.t2.archive'])
  })
})
