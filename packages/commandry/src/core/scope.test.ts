import { describe, it, expect } from 'vitest'
import { buildScopeTree, isValidChild, mergeContext, getAncestors, isAncestorOf } from './scope'

const SCOPES = {
  page: {
    children: {
      'task-list': {
        children: {
          'task-item': {},
        },
      },
      canvas: {
        children: {
          'canvas-node': {},
        },
      },
    },
  },
}

describe('buildScopeTree', () => {
  it('builds a flat lookup of all scope nodes', () => {
    const tree = buildScopeTree(SCOPES)
    expect(tree.nodes.size).toBe(5)
    expect(tree.nodes.has('page')).toBe(true)
    expect(tree.nodes.has('task-list')).toBe(true)
    expect(tree.nodes.has('task-item')).toBe(true)
    expect(tree.nodes.has('canvas')).toBe(true)
    expect(tree.nodes.has('canvas-node')).toBe(true)
  })

  it('sets parent references correctly', () => {
    const tree = buildScopeTree(SCOPES)
    expect(tree.nodes.get('page')!.parent).toBeNull()
    expect(tree.nodes.get('task-list')!.parent!.name).toBe('page')
    expect(tree.nodes.get('task-item')!.parent!.name).toBe('task-list')
  })

  it('sets child references correctly', () => {
    const tree = buildScopeTree(SCOPES)
    const page = tree.nodes.get('page')!
    expect(page.children.has('task-list')).toBe(true)
    expect(page.children.has('canvas')).toBe(true)
  })

  it('sets root node', () => {
    const tree = buildScopeTree(SCOPES)
    expect(tree.root).not.toBeNull()
    expect(tree.root!.name).toBe('page')
  })
})

describe('isValidChild', () => {
  it('validates correct parent-child nesting', () => {
    const tree = buildScopeTree(SCOPES)
    expect(isValidChild(tree, 'page', 'task-list')).toBe(true)
    expect(isValidChild(tree, 'task-list', 'task-item')).toBe(true)
    expect(isValidChild(tree, 'page', 'canvas')).toBe(true)
  })

  it('rejects invalid nesting', () => {
    const tree = buildScopeTree(SCOPES)
    expect(isValidChild(tree, 'task-list', 'canvas-node')).toBe(false)
    expect(isValidChild(tree, 'canvas', 'task-item')).toBe(false)
  })

  it('validates root-level scopes', () => {
    const tree = buildScopeTree(SCOPES)
    expect(isValidChild(tree, undefined, 'page')).toBe(true)
    expect(isValidChild(tree, undefined, 'task-list')).toBe(false)
  })
})

describe('mergeContext', () => {
  it('merges context from outermost to innermost', () => {
    const stack = ['page', 'task-list', 'task-item']
    const contexts = new Map<string, Record<string, unknown>>([
      ['page', { pageId: '1' }],
      ['task-list', { listId: 'abc' }],
      ['task-item', { taskId: '42' }],
    ])

    const merged = mergeContext(stack, contexts)
    expect(merged).toEqual({ pageId: '1', listId: 'abc', taskId: '42' })
  })

  it('inner overrides outer for same keys', () => {
    const stack = ['outer', 'inner']
    const contexts = new Map<string, Record<string, unknown>>([
      ['outer', { shared: 'outer-value', outerOnly: true }],
      ['inner', { shared: 'inner-value', innerOnly: true }],
    ])

    const merged = mergeContext(stack, contexts)
    expect(merged).toEqual({
      shared: 'inner-value',
      outerOnly: true,
      innerOnly: true,
    })
  })

  it('handles empty stack', () => {
    expect(mergeContext([], new Map())).toEqual({})
  })
})

describe('getAncestors', () => {
  it('returns ancestor chain in order', () => {
    const tree = buildScopeTree(SCOPES)
    expect(getAncestors(tree, 'task-item')).toEqual(['page', 'task-list'])
    expect(getAncestors(tree, 'task-list')).toEqual(['page'])
    expect(getAncestors(tree, 'page')).toEqual([])
  })
})

describe('isAncestorOf', () => {
  it('detects ancestor relationships', () => {
    const tree = buildScopeTree(SCOPES)
    expect(isAncestorOf(tree, 'page', 'task-item')).toBe(true)
    expect(isAncestorOf(tree, 'task-list', 'task-item')).toBe(true)
    expect(isAncestorOf(tree, 'canvas', 'task-item')).toBe(false)
    expect(isAncestorOf(tree, 'task-item', 'page')).toBe(false)
  })
})
