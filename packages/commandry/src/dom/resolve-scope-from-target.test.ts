import { describe, expect, it } from 'vitest'
import {
  DATA_COMMANDRY_MESSAGE_ID,
  DATA_COMMANDRY_SCOPE,
  DATA_COMMANDRY_THREAD_ID,
  resolveCommandryScopeFromTarget,
} from './resolve-scope-from-target'

describe('resolveCommandryScopeFromTarget', () => {
  it('returns innermost scope walking ancestors', () => {
    const root = document.createElement('div')
    root.setAttribute(DATA_COMMANDRY_SCOPE, 'app')
    const inner = document.createElement('div')
    inner.setAttribute(DATA_COMMANDRY_SCOPE, 'thread-item')
    inner.setAttribute(DATA_COMMANDRY_THREAD_ID, 't1')
    root.appendChild(inner)
    const leaf = document.createElement('span')
    inner.appendChild(leaf)

    expect(resolveCommandryScopeFromTarget(leaf)).toEqual({
      scope: 'thread-item',
      scopeElement: inner,
      threadId: 't1',
      messageId: null,
    })
  })

  it('returns message id when set on scope root', () => {
    const el = document.createElement('div')
    el.setAttribute(DATA_COMMANDRY_SCOPE, 'message')
    el.setAttribute(DATA_COMMANDRY_MESSAGE_ID, 'm1')
    const inner = document.createElement('span')
    el.appendChild(inner)

    expect(resolveCommandryScopeFromTarget(inner)).toEqual({
      scope: 'message',
      scopeElement: el,
      threadId: null,
      messageId: 'm1',
    })
  })

  it('returns nulls when no scope in chain', () => {
    const el = document.createElement('div')
    expect(resolveCommandryScopeFromTarget(el)).toEqual({
      scope: null,
      scopeElement: null,
      threadId: null,
      messageId: null,
    })
  })
})
