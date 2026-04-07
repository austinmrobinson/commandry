export type MailboxId = 'inbox' | 'starred' | 'sent' | 'drafts' | 'trash'

export interface Label {
  id: string
  name: string
  color: string
}

export interface Message {
  id: string
  threadId: string
  from: string
  to: string[]
  date: string
  body: string
}

export interface Thread {
  id: string
  mailboxId: MailboxId
  subject: string
  preview: string
  lastMessageAt: string
  participant: string
  messages: Message[]
}

export const LABELS: Label[] = [
  { id: 'work', name: 'Work', color: 'bg-blue-500/20 text-blue-300' },
  { id: 'personal', name: 'Personal', color: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'finance', name: 'Finance', color: 'bg-amber-500/20 text-amber-300' },
  { id: 'none', name: 'None', color: 'bg-zinc-500/20 text-zinc-300' },
]

/** Shown as "me" in the message thread UI */
export const DEMO_USER_EMAIL = 'you@demo.app'

export const MAILBOXES: {
  id: MailboxId
  name: string
  icon: 'inbox' | 'star' | 'send' | 'file' | 'trash'
}[] = [
  { id: 'inbox', name: 'Inbox', icon: 'inbox' },
  { id: 'starred', name: 'Starred', icon: 'star' },
  { id: 'sent', name: 'Sent', icon: 'send' },
  { id: 'drafts', name: 'Drafts', icon: 'file' },
  { id: 'trash', name: 'Trash', icon: 'trash' },
]

const now = new Date()
const iso = (d: Date) => d.toISOString()

function thread(
  id: string,
  mailboxId: MailboxId,
  participant: string,
  subject: string,
  preview: string,
  messages: Omit<Message, 'threadId' | 'date'>[],
): Thread {
  const at = new Date(now.getTime() - messages.length * 3600_000)
  return {
    id,
    mailboxId,
    subject,
    preview,
    participant,
    lastMessageAt: iso(at),
    messages: messages.map((m, i) => ({
      ...m,
      threadId: id,
      date: iso(new Date(at.getTime() + i * 600_000)),
    })),
  }
}

export const INITIAL_THREADS: Thread[] = [
  thread('t1', 'inbox', 'Alex Rivera', 'Q4 roadmap draft', 'Here is the first cut of the roadmap…', [
    {
      id: 't1m1',
      from: 'Alex Rivera <alex@example.com>',
      to: [DEMO_USER_EMAIL],
      body: 'Here is the first cut of the roadmap. Let me know what you think before Friday.\n\n— Alex',
    },
    {
      id: 't1m2',
      from: DEMO_USER_EMAIL,
      to: ['Alex Rivera <alex@example.com>'],
      body: 'Thanks — I will review this afternoon and leave comments inline.',
    },
  ]),
  thread('t2', 'inbox', 'Billing', 'Your receipt for April', 'Thanks for your subscription…', [
    {
      id: 't2m1',
      from: 'Billing <billing@example.com>',
      to: [DEMO_USER_EMAIL],
      body: 'Thanks for your subscription. Your receipt is attached.\n\nTotal: $12.00',
    },
  ]),
  thread('t3', 'inbox', 'Sam Lee', 'Design review notes', 'A few small tweaks to spacing…', [
    {
      id: 't3m1',
      from: 'Sam Lee <sam@example.com>',
      to: [DEMO_USER_EMAIL],
      body: 'A few small tweaks to spacing on the settings screen. Screenshots below.',
    },
  ]),
  thread('t4', 'sent', DEMO_USER_EMAIL, 'Re: Launch checklist', 'Sounds good — ship it.', [
    {
      id: 't4m1',
      from: DEMO_USER_EMAIL,
      to: ['team@example.com'],
      body: 'Sounds good — ship it.',
    },
  ]),
  thread('t5', 'drafts', DEMO_USER_EMAIL, 'Draft: weekly update', 'This week we shipped…', [
    {
      id: 't5m1',
      from: DEMO_USER_EMAIL,
      to: ['team@example.com'],
      body: 'This week we shipped the new command palette and polish fixes.',
    },
  ]),
]

export function getThreadById(id: string): Thread | undefined {
  return INITIAL_THREADS.find(t => t.id === id)
}
