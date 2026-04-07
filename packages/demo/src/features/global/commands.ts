import { FileText, Inbox, Moon, Palette, Send, Settings, Sun, Trash2 } from 'lucide-react'
import { defineCommands } from '@/lib/commandry'
import { showToast } from '@/lib/show-toast'
import {
  openSettings,
  setCommandPaletteOpen,
  setSelectedMailboxId,
  toggleTheme,
  getMailState,
} from '@/lib/store'
import { getThreadsForMailbox } from '@/lib/thread-utils'

export const globalCommands = defineCommands({
  'global.commandPalette': {
    label: 'Command palette',
    icon: Palette,
    group: 'General',
    keywords: ['search', 'commands', 'palette'],
    shortcut: [['mod', 'k']],
    handler: () => setCommandPaletteOpen(true),
  },
  'global.settings': {
    label: 'Settings',
    icon: Settings,
    group: 'General',
    shortcut: [['mod', ',']],
    handler: () => {
      openSettings()
      showToast('Settings opened (demo)', Settings)
    },
  },
  'global.theme': {
    label: 'Toggle theme',
    icon: Sun,
    group: 'General',
    keywords: ['dark', 'light', 'appearance'],
    shortcut: [['mod', 'shift', 'l']],
    handler: () => {
      toggleTheme()
      const next = getMailState().theme
      showToast(`Switched to ${next} mode`, next === 'dark' ? Moon : Sun)
    },
  },
  'nav.inbox': {
    label: 'Go to Inbox',
    icon: Inbox,
    group: 'Navigate',
    keywords: ['mailbox', 'inbox'],
    shortcut: [['g'], ['i']],
    handler: () => setSelectedMailboxId('inbox', getThreadsForMailbox('inbox')[0]?.id),
  },
  'nav.sent': {
    label: 'Go to Sent',
    icon: Send,
    group: 'Navigate',
    shortcut: [['g'], ['s']],
    handler: () => setSelectedMailboxId('sent', getThreadsForMailbox('sent')[0]?.id),
  },
  'nav.drafts': {
    label: 'Go to Drafts',
    icon: FileText,
    group: 'Navigate',
    shortcut: [['g'], ['d']],
    handler: () => setSelectedMailboxId('drafts', getThreadsForMailbox('drafts')[0]?.id),
  },
  'nav.trash': {
    label: 'Go to Trash',
    icon: Trash2,
    group: 'Navigate',
    shortcut: [['g'], ['t']],
    handler: () => setSelectedMailboxId('trash', getThreadsForMailbox('trash')[0]?.id),
  },
})
