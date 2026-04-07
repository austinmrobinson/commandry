import { INITIAL_THREADS, type MailboxId, type Thread } from './mock-data'
import { getMailState } from './store'

export function getThreadsForMailbox(mailboxId: MailboxId): Thread[] {
  const s = getMailState()
  return INITIAL_THREADS.filter(t => {
    if (s.threadTrashed[t.id]) return mailboxId === 'trash'
    if (mailboxId === 'trash') return false
    if (s.threadArchived[t.id]) return false
    if (mailboxId === 'inbox') return t.mailboxId === 'inbox'
    if (mailboxId === 'starred') return s.threadStarred[t.id] ?? false
    if (mailboxId === 'sent') return t.mailboxId === 'sent'
    if (mailboxId === 'drafts') return t.mailboxId === 'drafts'
    return false
  })
}

export function isThreadUnread(threadId: string, mailboxId: string): boolean {
  const s = getMailState()
  if (s.threadRead[threadId] === true) return false
  if (s.threadRead[threadId] === false) return true
  return mailboxId === 'inbox'
}

export function formatThreadTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
