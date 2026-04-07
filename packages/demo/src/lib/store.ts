import { useMemo, useSyncExternalStore } from 'react'
import type { MailboxId } from './mock-data'
import { getThreadById } from './mock-data'
import { registry } from '@/lib/commandry'

export type ThemeMode = 'dark' | 'light'

export interface MailState {
  /** Bumps on every patch so selectors can cheaply subscribe to all changes */
  epoch: number
  selectedMailboxId: MailboxId
  selectedThreadId: string | null
  /** Ordered set of thread IDs currently multi-selected */
  selectedThreadIds: string[]
  /** The last thread ID that was clicked (anchor for shift-click range) */
  lastClickedThreadId: string | null
  commandPaletteOpen: boolean
  theme: ThemeMode
  /** threadId -> overrides */
  threadRead: Record<string, boolean>
  threadStarred: Record<string, boolean>
  threadArchived: Record<string, boolean>
  threadTrashed: Record<string, boolean>
  threadLabelId: Record<string, string>
  messageImportant: Record<string, boolean>
}

const listeners = new Set<() => void>()

let state: MailState = {
  epoch: 0,
  selectedMailboxId: 'inbox',
  selectedThreadId: 't1',
  selectedThreadIds: [],
  lastClickedThreadId: null,
  commandPaletteOpen: false,
  theme: 'light',
  threadRead: {},
  threadStarred: {},
  threadArchived: {},
  threadTrashed: {},
  threadLabelId: {},
  messageImportant: {},
}

function emit() {
  for (const l of listeners) l()
}

export function getMailState(): MailState {
  return state
}

/**
 * Target thread IDs for list actions (archive, delete, star, read, label).
 * When `selectedThreadIds` is non-empty, all thread-item command instances
 * (including deduped cmdk / context menu entries) apply to the full selection.
 */
export function getThreadActionTargetIds(ctxThreadId: string): string[] {
  if (state.selectedThreadIds.length > 0) return [...state.selectedThreadIds]
  if (ctxThreadId) return [ctxThreadId]
  if (state.selectedThreadId) return [state.selectedThreadId]
  return []
}

export function subscribeMailStore(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function patch(partial: Partial<Omit<MailState, 'epoch'>>) {
  state = { ...state, ...partial, epoch: state.epoch + 1 }
  emit()
}

export function setSelectedMailboxId(id: MailboxId, firstThreadId?: string | null) {
  patch({ selectedMailboxId: id, selectedThreadId: firstThreadId ?? null, selectedThreadIds: [], lastClickedThreadId: null })
}

export function setSelectedThreadId(id: string | null) {
  patch({ selectedThreadId: id, selectedThreadIds: [], lastClickedThreadId: id })
}

export function clearMultiSelection() {
  patch({ selectedThreadIds: [], lastClickedThreadId: null })
}

export function toggleThreadSelection(threadId: string) {
  const ids = state.selectedThreadIds
  const next = ids.includes(threadId) ? ids.filter(id => id !== threadId) : [...ids, threadId]
  patch({ selectedThreadIds: next, lastClickedThreadId: threadId })
}

export function selectThreadRange(threadIds: string[], fromId: string | null, toId: string) {
  if (!fromId) {
    patch({ selectedThreadIds: [toId], lastClickedThreadId: toId })
    return
  }
  const fromIdx = threadIds.indexOf(fromId)
  const toIdx = threadIds.indexOf(toId)
  if (fromIdx === -1 || toIdx === -1) {
    patch({ selectedThreadIds: [toId], lastClickedThreadId: toId })
    return
  }
  const start = Math.min(fromIdx, toIdx)
  const end = Math.max(fromIdx, toIdx)
  const range = threadIds.slice(start, end + 1)
  const merged = Array.from(new Set([...state.selectedThreadIds, ...range]))
  patch({ selectedThreadIds: merged, lastClickedThreadId: toId })
}

export function bulkArchiveThreads(threadIds: string[]) {
  const archived = { ...state.threadArchived }
  for (const id of threadIds) archived[id] = true
  patch({ threadArchived: archived, selectedThreadIds: [], lastClickedThreadId: null })
}

export function bulkDeleteThreads(threadIds: string[]) {
  const trashed = { ...state.threadTrashed }
  for (const id of threadIds) trashed[id] = true
  patch({ threadTrashed: trashed, selectedThreadIds: [], lastClickedThreadId: null })
}

export function bulkStarThreads(threadIds: string[]) {
  const starred = { ...state.threadStarred }
  for (const id of threadIds) starred[id] = true
  patch({ threadStarred: starred })
}

export function bulkMarkReadThreads(threadIds: string[]) {
  const read = { ...state.threadRead }
  for (const id of threadIds) read[id] = true
  patch({ threadRead: read })
}

export function bulkSetThreadLabel(threadIds: string[], labelId: string) {
  const labels = { ...state.threadLabelId }
  for (const id of threadIds) labels[id] = labelId
  patch({ threadLabelId: labels })
}

export function setCommandPaletteOpen(open: boolean) {
  if (open) {
    if (!state.commandPaletteOpen) {
      registry.pinActiveScopeSnapshot()
    }
  } else {
    registry.clearActiveScopeSnapshotPin()
  }
  patch({ commandPaletteOpen: open })
}

export function toggleTheme() {
  const next: ThemeMode = state.theme === 'dark' ? 'light' : 'dark'
  patch({ theme: next })
  applyThemeClass(next)
}

export function applyThemeClass(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function markThreadRead(threadId: string) {
  patch({
    threadRead: { ...state.threadRead, [threadId]: true },
  })
}

export function toggleThreadRead(threadId: string) {
  const t = getThreadById(threadId)
  const defaultRead = t ? t.mailboxId !== 'inbox' : true
  const current =
    state.threadRead[threadId] !== undefined ? state.threadRead[threadId] : defaultRead
  patch({
    threadRead: { ...state.threadRead, [threadId]: !current },
  })
}

export function toggleThreadStarred(threadId: string, defaultStarred: boolean) {
  const current =
    state.threadStarred[threadId] !== undefined
      ? state.threadStarred[threadId]
      : defaultStarred
  patch({
    threadStarred: { ...state.threadStarred, [threadId]: !current },
  })
}

export function setThreadArchived(threadId: string, archived: boolean) {
  patch({
    threadArchived: { ...state.threadArchived, [threadId]: archived },
  })
}

export function setThreadTrashed(threadId: string, trashed: boolean) {
  patch({
    threadTrashed: { ...state.threadTrashed, [threadId]: trashed },
  })
}

export function setThreadLabel(threadId: string, labelId: string) {
  patch({
    threadLabelId: { ...state.threadLabelId, [threadId]: labelId },
  })
}

export function toggleMessageImportant(messageId: string) {
  const cur = state.messageImportant[messageId] ?? false
  patch({
    messageImportant: { ...state.messageImportant, [messageId]: !cur },
  })
}

export function openSettings() {
  // handled via toast in global commands
}

/** Subscribe hook for React components */
export function useMailStore<T>(selector: (s: MailState) => T): T {
  return useSyncExternalStore(
    subscribeMailStore,
    () => selector(state),
    () => selector(state),
  )
}

const mailActions = {
  setSelectedMailboxId,
  setSelectedThreadId,
  setCommandPaletteOpen,
  toggleTheme,
  markThreadRead,
  toggleThreadRead,
  toggleThreadStarred,
  setThreadArchived,
  setThreadTrashed,
  setThreadLabel,
  toggleMessageImportant,
  openSettings,
  clearMultiSelection,
  toggleThreadSelection,
  selectThreadRange,
  bulkArchiveThreads,
  bulkDeleteThreads,
  bulkStarThreads,
  bulkMarkReadThreads,
  bulkSetThreadLabel,
} as const

export function useMailActions() {
  return useMemo(() => mailActions, [])
}
