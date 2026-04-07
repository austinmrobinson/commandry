import { Copy, Forward, Reply, ReplyAll, Sparkles } from 'lucide-react'
import type { CommandDefinitionMap } from 'commandry'
import { defineCommands } from '@/lib/commandry'
import { messagePaletteGroupTitle } from '@/lib/palette-labels'
import { getThreadById } from '@/lib/mock-data'
import { showToast, showSuccessToast } from '@/lib/show-toast'
import { getMailState, toggleMessageImportant } from '@/lib/store'

export function createMessageCommands(
  messageId: string,
  threadId: string,
): CommandDefinitionMap {
  const base = `message.${messageId}`

  return defineCommands({
    [`${base}.reply`]: {
      label: 'Reply',
      icon: Reply,
      group: ({ ctx }) => messagePaletteGroupTitle(ctx),
      shortcut: [['r']],
      handler: () => { showToast('Reply opened (demo)', Reply) },
    },
    [`${base}.replyAll`]: {
      label: 'Reply all',
      icon: ReplyAll,
      group: ({ ctx }) => messagePaletteGroupTitle(ctx),
      shortcut: [['a']],
      handler: () => { showToast('Reply all opened (demo)', ReplyAll) },
    },
    [`${base}.forward`]: {
      label: 'Forward',
      icon: Forward,
      group: ({ ctx }) => messagePaletteGroupTitle(ctx),
      shortcut: [['f']],
      handler: () => { showToast('Forward opened (demo)', Forward) },
    },
    [`${base}.copy`]: {
      label: 'Copy text',
      icon: Copy,
      group: ({ ctx }) => messagePaletteGroupTitle(ctx),
      shortcut: [['mod', 'shift', 'c']],
      handler: () => {
        const thread = getThreadById(threadId)
        const msg = thread?.messages.find(m => m.id === messageId)
        const text = msg?.body ?? ''
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(text)
        }
        showSuccessToast('Text copied to clipboard', Copy)
      },
    },
    [`${base}.important`]: {
      kind: 'toggle' as const,
      label: 'Important',
      icon: Sparkles,
      group: ({ ctx }) => messagePaletteGroupTitle(ctx),
      shortcut: [['mod', 'shift', 'i']],
      checked: () => getMailState().messageImportant[messageId] ?? false,
      handler: () => {
        const wasImportant = getMailState().messageImportant[messageId] ?? false
        toggleMessageImportant(messageId)
        showToast(wasImportant ? 'Removed from important' : 'Marked as important', Sparkles)
      },
    },
  })
}
