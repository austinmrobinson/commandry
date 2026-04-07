import {
  Archive,
  Forward,
  Reply,
  Star,
  StarOff,
  Tag,
  Trash2,
  MailOpen,
  Mail,
} from 'lucide-react'
import type { CommandDefinitionMap } from 'commandry'
import { defineCommands } from '@/lib/commandry'
import { getThreadById, LABELS } from '@/lib/mock-data'
import { showToast, showSuccessToast } from '@/lib/show-toast'
import {
  threadListPaletteGroupTitle,
  threadPaletteGroupTitle,
} from '@/lib/palette-labels'
import {
  getMailState,
  getThreadActionTargetIds,
  setThreadArchived,
  setThreadTrashed,
  toggleThreadRead,
  toggleThreadStarred,
  bulkArchiveThreads,
  bulkDeleteThreads,
  bulkStarThreads,
  bulkMarkReadThreads,
  bulkSetThreadLabel,
} from '@/lib/store'

function plural(ids: string[], singular: string, pluralForm?: string) {
  if (ids.length === 1) return singular
  return `${ids.length} ${pluralForm ?? `${singular.toLowerCase()}s`}`
}

/** Lets the command palette match individual label names while Label is a single root row. */
const LABEL_SEARCH_KEYWORDS = LABELS.flatMap(l => [l.name, l.name.toLowerCase()])

/** Anchor for thread-list scoped commands when not in a multi-selection. */
function listFocusThreadId(): string {
  const s = getMailState()
  return s.selectedThreadId ?? s.selectedThreadIds[0] ?? ''
}

function listTargets(): string[] {
  return getThreadActionTargetIds(listFocusThreadId())
}

export function createThreadCommands(threadId: string): CommandDefinitionMap {
  const base = `thread.${threadId}`

  return defineCommands({
    [`${base}.archive`]: {
      label: 'Archive',
      icon: Archive,
      group: ({ ctx }) => threadPaletteGroupTitle(ctx, threadId),
      bulkAction: true,
      shortcut: [['e']],
      when: () => {
        const s = getMailState()
        const ids = getThreadActionTargetIds(threadId)
        return ids.some(id => !(s.threadArchived[id] ?? false))
      },
      handler: () => {
        const ids = getThreadActionTargetIds(threadId)
        bulkArchiveThreads(ids)
        showSuccessToast(`${plural(ids, 'Thread')} archived`, Archive, {
          action: {
            label: 'Undo',
            onClick: () => { for (const id of ids) setThreadArchived(id, false) },
          },
        })
      },
    },
    [`${base}.delete`]: {
      label: 'Delete',
      icon: Trash2,
      group: ({ ctx }) => threadPaletteGroupTitle(ctx, threadId),
      bulkAction: true,
      danger: true,
      shortcut: [['shift', '#']],
      handler: () => {
        const ids = getThreadActionTargetIds(threadId)
        bulkDeleteThreads(ids)
        showToast(`${plural(ids, 'Thread')} moved to trash`, Trash2, {
          action: {
            label: 'Undo',
            onClick: () => { for (const id of ids) setThreadTrashed(id, false) },
          },
        })
      },
    },
    [`${base}.star`]: {
      kind: 'toggle' as const,
      label: 'Starred',
      icon: Star,
      group: ({ ctx }) => threadPaletteGroupTitle(ctx, threadId),
      bulkAction: true,
      shortcut: [['s']],
      checked: () => {
        const s = getMailState()
        const ids = getThreadActionTargetIds(threadId)
        return ids.every(id => {
          const t = getThreadById(id)
          const def = t?.mailboxId === 'starred'
          return s.threadStarred[id] ?? def
        })
      },
      handler: () => {
        const ids = getThreadActionTargetIds(threadId)
        if (ids.length > 1) {
          bulkStarThreads(ids)
          showToast(`${ids.length} threads starred`, Star)
        } else {
          const id = ids[0]
          const t = getThreadById(id)
          const def = t?.mailboxId === 'starred'
          const wasStarred = getMailState().threadStarred[id] ?? def
          toggleThreadStarred(id, def)
          showToast(wasStarred ? 'Star removed' : 'Thread starred', wasStarred ? StarOff : Star)
        }
      },
    },
    [`${base}.read`]: {
      kind: 'toggle' as const,
      label: 'Read',
      icon: MailOpen,
      group: ({ ctx }) => threadPaletteGroupTitle(ctx, threadId),
      bulkAction: true,
      shortcut: [['shift', 'u']],
      checked: () => {
        const s = getMailState()
        const ids = getThreadActionTargetIds(threadId)
        return ids.every(id => {
          const t = getThreadById(id)
          const defaultRead = t ? t.mailboxId !== 'inbox' : true
          return s.threadRead[id] !== undefined ? s.threadRead[id] : defaultRead
        })
      },
      handler: () => {
        const ids = getThreadActionTargetIds(threadId)
        if (ids.length > 1) {
          bulkMarkReadThreads(ids)
          showToast(`${ids.length} threads marked as read`, MailOpen)
        } else {
          const id = ids[0]
          const t = getThreadById(id)
          const defaultRead = t ? t.mailboxId !== 'inbox' : true
          const s = getMailState()
          const wasRead = s.threadRead[id] !== undefined ? s.threadRead[id] : defaultRead
          toggleThreadRead(id)
          showToast(wasRead ? 'Marked as unread' : 'Marked as read', wasRead ? Mail : MailOpen)
        }
      },
    },
    [`${base}.label`]: {
      kind: 'radio' as const,
      label: 'Label',
      icon: Tag,
      group: ({ ctx }) => threadPaletteGroupTitle(ctx, threadId),
      bulkAction: true,
      keywords: ['label', 'tag', ...LABEL_SEARCH_KEYWORDS],
      options: LABELS.map(l => ({ id: l.id, label: l.name, icon: Tag })),
      value: () => {
        const ids = getThreadActionTargetIds(threadId)
        const s = getMailState()
        if (ids.length <= 1) return s.threadLabelId[ids[0] ?? threadId] ?? 'none'
        const vals = ids.map(id => s.threadLabelId[id] ?? 'none')
        const first = vals[0]
        return vals.every(v => v === first) ? first : 'none'
      },
      handler: ({ value }: { ctx: Record<string, unknown>; value: string }) => {
        const ids = getThreadActionTargetIds(threadId)
        bulkSetThreadLabel(ids, value)
        const label = LABELS.find(l => l.id === value)
        const target = plural(ids, 'Thread')
        showToast(label ? `${target} labeled ${label.name}` : `Label removed from ${target.toLowerCase()}`, Tag)
      },
    },
    [`${base}.reply`]: {
      label: 'Reply',
      icon: Reply,
      group: ({ ctx }) => threadPaletteGroupTitle(ctx, threadId),
      bulkAction: false,
      shortcut: [['r']],
      handler: () => { showToast('Reply opened (demo)', Reply) },
    },
    [`${base}.forward`]: {
      label: 'Forward',
      icon: Forward,
      group: ({ ctx }) => threadPaletteGroupTitle(ctx, threadId),
      bulkAction: false,
      shortcut: [['f']],
      handler: () => { showToast('Forward opened (demo)', Forward) },
    },
  })
}

/**
 * Thread-list scope: same shortcuts as rows, but `bulkAction: true` so shortcuts
 * still resolve while the pointer is outside rows (e.g. message pane) and cmdk
 * prefers these when multiple threads are selected.
 */
export function createThreadListCommands(): CommandDefinitionMap {
  return defineCommands({
    'threadList.archive': {
      label: 'Archive',
      icon: Archive,
      group: () => threadListPaletteGroupTitle(),
      bulkAction: true,
      shortcut: [['e']],
      when: () => {
        const s = getMailState()
        const ids = listTargets()
        return ids.length > 0 && ids.some(id => !(s.threadArchived[id] ?? false))
      },
      handler: () => {
        const ids = listTargets()
        if (ids.length === 0) return
        bulkArchiveThreads(ids)
        showSuccessToast(`${plural(ids, 'Thread')} archived`, Archive, {
          action: {
            label: 'Undo',
            onClick: () => { for (const id of ids) setThreadArchived(id, false) },
          },
        })
      },
    },
    'threadList.delete': {
      label: 'Delete',
      icon: Trash2,
      group: () => threadListPaletteGroupTitle(),
      bulkAction: true,
      danger: true,
      shortcut: [['shift', '#']],
      when: () => listTargets().length > 0,
      handler: () => {
        const ids = listTargets()
        if (ids.length === 0) return
        bulkDeleteThreads(ids)
        showToast(`${plural(ids, 'Thread')} moved to trash`, Trash2, {
          action: {
            label: 'Undo',
            onClick: () => { for (const id of ids) setThreadTrashed(id, false) },
          },
        })
      },
    },
    'threadList.star': {
      kind: 'toggle' as const,
      label: 'Starred',
      icon: Star,
      group: () => threadListPaletteGroupTitle(),
      bulkAction: true,
      shortcut: [['s']],
      when: () => listTargets().length > 0,
      checked: () => {
        const ids = listTargets()
        if (ids.length === 0) return false
        const s = getMailState()
        return ids.every(id => {
          const t = getThreadById(id)
          const def = t?.mailboxId === 'starred'
          return s.threadStarred[id] ?? def
        })
      },
      handler: () => {
        const ids = listTargets()
        if (ids.length === 0) return
        if (ids.length > 1) {
          bulkStarThreads(ids)
          showToast(`${ids.length} threads starred`, Star)
        } else {
          const id = ids[0]
          const t = getThreadById(id)
          const def = t?.mailboxId === 'starred'
          const wasStarred = getMailState().threadStarred[id] ?? def
          toggleThreadStarred(id, def)
          showToast(wasStarred ? 'Star removed' : 'Thread starred', wasStarred ? StarOff : Star)
        }
      },
    },
    'threadList.read': {
      kind: 'toggle' as const,
      label: 'Read',
      icon: MailOpen,
      group: () => threadListPaletteGroupTitle(),
      bulkAction: true,
      shortcut: [['shift', 'u']],
      when: () => listTargets().length > 0,
      checked: () => {
        const ids = listTargets()
        if (ids.length === 0) return false
        const s = getMailState()
        return ids.every(id => {
          const t = getThreadById(id)
          const defaultRead = t ? t.mailboxId !== 'inbox' : true
          return s.threadRead[id] !== undefined ? s.threadRead[id] : defaultRead
        })
      },
      handler: () => {
        const ids = listTargets()
        if (ids.length === 0) return
        if (ids.length > 1) {
          bulkMarkReadThreads(ids)
          showToast(`${ids.length} threads marked as read`, MailOpen)
        } else {
          const id = ids[0]
          const t = getThreadById(id)
          const defaultRead = t ? t.mailboxId !== 'inbox' : true
          const s = getMailState()
          const wasRead = s.threadRead[id] !== undefined ? s.threadRead[id] : defaultRead
          toggleThreadRead(id)
          showToast(wasRead ? 'Marked as unread' : 'Marked as read', wasRead ? Mail : MailOpen)
        }
      },
    },
    'threadList.label': {
      kind: 'radio' as const,
      label: 'Label',
      icon: Tag,
      group: () => threadListPaletteGroupTitle(),
      bulkAction: true,
      keywords: ['label', 'tag', ...LABEL_SEARCH_KEYWORDS],
      options: LABELS.map(l => ({ id: l.id, label: l.name, icon: Tag })),
      when: () => listTargets().length > 0,
      value: () => {
        const ids = listTargets()
        const s = getMailState()
        if (ids.length === 0) return 'none'
        if (ids.length === 1) return s.threadLabelId[ids[0]] ?? 'none'
        const vals = ids.map(id => s.threadLabelId[id] ?? 'none')
        const first = vals[0]
        return vals.every(v => v === first) ? first : 'none'
      },
      handler: ({ value }: { ctx: Record<string, unknown>; value: string }) => {
        const ids = listTargets()
        if (ids.length === 0) return
        bulkSetThreadLabel(ids, value)
        const label = LABELS.find(l => l.id === value)
        const target = plural(ids, 'Thread')
        showToast(label ? `${target} labeled ${label.name}` : `Label removed from ${target.toLowerCase()}`, Tag)
      },
    },
  })
}
