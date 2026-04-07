import type { RuntimeScopeConfig, ScopeNode, ScopeTree } from './types'

export function buildScopeTree(
  scopes: Record<string, RuntimeScopeConfig>,
): ScopeTree {
  const nodes = new Map<string, ScopeNode>()
  const roots: ScopeNode[] = []

  function walk(
    config: Record<string, RuntimeScopeConfig>,
    parent: ScopeNode | null,
  ) {
    for (const [name, def] of Object.entries(config)) {
      const node: ScopeNode = { name, parent, children: new Map() }
      nodes.set(name, node)

      if (parent) {
        parent.children.set(name, node)
      } else {
        roots.push(node)
      }

      if (def.children) {
        walk(def.children, node)
      }
    }
  }

  walk(scopes, null)

  return {
    root: roots[0] ?? null,
    nodes,
  }
}

export function mergeContext(
  scopeStack: string[],
  scopeContexts: Map<string, Record<string, unknown>>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const scope of scopeStack) {
    const ctx = scopeContexts.get(scope)
    if (ctx) Object.assign(merged, ctx)
  }
  return merged
}

export function isValidChild(
  tree: ScopeTree,
  parentScope: string | undefined,
  childScope: string,
): boolean {
  if (!parentScope) {
    return tree.nodes.has(childScope) &&
      tree.nodes.get(childScope)!.parent === null
  }

  const parentNode = tree.nodes.get(parentScope)
  if (!parentNode) return false
  return parentNode.children.has(childScope)
}

export function getAncestors(
  tree: ScopeTree,
  scope: string,
): string[] {
  const ancestors: string[] = []
  let node = tree.nodes.get(scope)?.parent
  while (node) {
    ancestors.unshift(node.name)
    node = node.parent
  }
  return ancestors
}

export function isAncestorOf(
  tree: ScopeTree,
  ancestor: string,
  descendant: string,
): boolean {
  let node = tree.nodes.get(descendant)?.parent
  while (node) {
    if (node.name === ancestor) return true
    node = node.parent
  }
  return false
}
