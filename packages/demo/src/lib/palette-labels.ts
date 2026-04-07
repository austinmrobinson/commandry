/** Shared helpers for command palette labels and scope subtitle (cmdk). */

import { getThreadById } from '@/lib/mock-data'
import { getMailState, getThreadActionTargetIds } from '@/lib/store'

function listFocusThreadId(): string {
  const s = getMailState()
  return s.selectedThreadId ?? s.selectedThreadIds[0] ?? ''
}

export function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 1))}…`
}

/** Cmdk group heading for thread-item scoped commands. */
export function threadPaletteGroupTitle(ctx: Record<string, unknown>, threadId: string): string {
  return `Thread${threadCommandLabelSuffix(ctx, threadId)}`
}

/** Cmdk group heading for message scoped commands. */
export function messagePaletteGroupTitle(ctx: Record<string, unknown>): string {
  return `Message${messageCommandLabelSuffix(ctx)}`
}

/** Cmdk group heading for thread-list scoped commands (list focus / selection). */
export function threadListPaletteGroupTitle(): string {
  return `Thread${listCommandLabelSuffix()}`
}

/** Suffix for per-row thread-item commands (bulk vs single subject). */
function threadCommandLabelSuffix(ctx: Record<string, unknown>, threadId: string): string {
  const ids = getThreadActionTargetIds(threadId)
  if (ids.length > 1) return ` · ${ids.length} threads`
  let subj = typeof ctx.threadSubject === 'string' ? ctx.threadSubject : ''
  if (!subj.trim()) {
    const t = getThreadById(threadId)
    subj = t?.subject ?? ''
  }
  if (subj.trim()) return ` · ${truncate(subj, 42)}`
  return ''
}

function messageCommandLabelSuffix(ctx: Record<string, unknown>): string {
  const from = typeof ctx.messageFrom === 'string' ? ctx.messageFrom : ''
  if (from.trim()) return ` · ${truncate(from, 36)}`
  return ''
}

/** Suffix for thread-list scoped commands (focused / multi selection). */
function listCommandLabelSuffix(): string {
  const ids = getThreadActionTargetIds(listFocusThreadId())
  if (ids.length === 0) return ''
  if (ids.length > 1) return ` · ${ids.length} threads`
  const t = getThreadById(ids[0])
  return t?.subject ? ` · ${truncate(t.subject, 42)}` : ''
}
