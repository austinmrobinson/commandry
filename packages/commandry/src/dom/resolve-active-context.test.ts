import { describe, expect, it } from 'vitest'
import {
  DATA_COMMANDRY_MESSAGE_ID,
  DATA_COMMANDRY_REGION,
  DATA_COMMANDRY_THREAD_ID,
} from './region-attributes'
import { resolveRegionFromTarget } from './resolve-active-context'

describe('resolveRegionFromTarget', () => {
  it('returns innermost region walking ancestors', () => {
    const root = document.createElement('div')
    root.setAttribute(DATA_COMMANDRY_REGION, 'app')
    const inner = document.createElement('div')
    inner.setAttribute(DATA_COMMANDRY_REGION, 'thread-item')
    inner.setAttribute(DATA_COMMANDRY_THREAD_ID, 't1')
    root.appendChild(inner)
    const leaf = document.createElement('span')
    inner.appendChild(leaf)

    expect(resolveRegionFromTarget(leaf)).toEqual({
      region: 'thread-item',
      regionElement: inner,
      threadId: 't1',
      messageId: null,
      context: {
        regions: ['app', 'thread-item'],
        anchors: { threadId: 't1' },
        ctx: {},
        element: inner,
      },
    })
  })

  it('returns message id when set on region root', () => {
    const el = document.createElement('div')
    el.setAttribute(DATA_COMMANDRY_REGION, 'message')
    el.setAttribute(DATA_COMMANDRY_MESSAGE_ID, 'm1')
    const inner = document.createElement('span')
    el.appendChild(inner)

    const result = resolveRegionFromTarget(inner)
    expect(result.region).toBe('message')
    expect(result.messageId).toBe('m1')
    expect(result.context.anchors.messageId).toBe('m1')
  })

  it('returns nulls when no region in chain', () => {
    const el = document.createElement('div')
    expect(resolveRegionFromTarget(el)).toEqual({
      region: null,
      regionElement: null,
      threadId: null,
      messageId: null,
      context: {
        regions: [],
        anchors: {},
        ctx: {},
        element: null,
      },
    })
  })
})
