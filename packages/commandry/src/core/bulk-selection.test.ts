import { describe, expect, it } from 'vitest'
import { keepInBulkSelectionMode } from './bulk-selection'

describe('keepInBulkSelectionMode', () => {
  it('keeps non-thread-item scopes regardless of bulkAction', () => {
    expect(keepInBulkSelectionMode({ scope: null, bulkAction: false })).toBe(true)
    expect(keepInBulkSelectionMode({ scope: 'thread-list', bulkAction: false })).toBe(true)
    expect(keepInBulkSelectionMode({ scope: 'app', bulkAction: undefined })).toBe(true)
  })

  it('keeps thread-item only when bulkAction is true', () => {
    expect(keepInBulkSelectionMode({ scope: 'thread-item', bulkAction: true })).toBe(true)
    expect(keepInBulkSelectionMode({ scope: 'thread-item', bulkAction: false })).toBe(false)
    expect(keepInBulkSelectionMode({ scope: 'thread-item', bulkAction: undefined })).toBe(false)
  })

  it('respects custom scopedLayer', () => {
    expect(keepInBulkSelectionMode({ scope: 'task-item', bulkAction: false }, 'task-item')).toBe(
      false,
    )
    expect(keepInBulkSelectionMode({ scope: 'task-item', bulkAction: true }, 'task-item')).toBe(
      true,
    )
  })
})
