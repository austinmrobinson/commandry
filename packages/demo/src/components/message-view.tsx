'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  Archive,
  Copy,
  Forward,
  MoreHorizontal,
  Reply,
  ReplyAll,
  Sparkles,
  Star,
  Tag,
  Trash2,
} from 'lucide-react'
import type { ShortcutField } from 'commandry'
import {
  CommandScope,
  useCommand,
  useRegisterCommands,
  useShortcutDisplay,
} from 'commandry/react'
import { createMessageCommands } from '@/features/messages/commands'
import { getThreadById } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useMailStore } from '@/lib/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function getMessageSenderInitials(from: string): string {
  const bracket = from.match(/^(.+?)\s*<([^>]+)>\s*$/)
  const namePart = bracket ? bracket[1].trim() : (from.split('@')[0] ?? from).trim()
  const words = namePart.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const a = words[0].at(0) ?? ''
    const b = words[words.length - 1].at(0) ?? ''
    return `${a}${b}`.toUpperCase()
  }
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return '?'
}

function ToolbarButton({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string
  shortcut?: ShortcutField
  onClick: () => void
  children: React.ReactNode
}) {
  const shortcutText = useShortcutDisplay(shortcut, 'all')

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <span>{label}</span>
        {shortcutText ? (
          <kbd
            data-slot="kbd"
            className="pointer-events-none inline-flex items-center rounded-sm bg-background/15 px-1 font-mono text-[10px] text-background/90"
          >
            {shortcutText}
          </kbd>
        ) : null}
      </TooltipContent>
    </Tooltip>
  )
}

function MessageActionsToolbar({ messageId }: { messageId: string }) {
  const base = `message.${messageId}`
  const reply = useCommand(`${base}.reply`)
  const replyAll = useCommand(`${base}.replyAll`)
  const forward = useCommand(`${base}.forward`)
  const copy = useCommand(`${base}.copy`)
  const important = useCommand(`${base}.important`)

  const copyShortcutText = useShortcutDisplay(copy?.shortcut, 'all')
  const importantShortcutText = useShortcutDisplay(important?.shortcut, 'all')

  const run = useCallback((cmd: ReturnType<typeof useCommand>) => {
    if (cmd && !cmd.disabled) void cmd.execute()
  }, [])

  return (
    <div
      className="flex shrink-0 items-center gap-0.5"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      <ToolbarButton
        label={reply?.label ?? 'Reply'}
        shortcut={reply?.shortcut}
        onClick={() => run(reply)}
      >
        <Reply className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={replyAll?.label ?? 'Reply all'}
        shortcut={replyAll?.shortcut}
        onClick={() => run(replyAll)}
      >
        <ReplyAll className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={forward?.label ?? 'Forward'}
        shortcut={forward?.shortcut}
        onClick={() => run(forward)}
      >
        <Forward className="size-4" />
      </ToolbarButton>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="More message actions"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="min-w-44">
          <DropdownMenuItem
            disabled={copy?.disabled}
            onClick={() => run(copy)}
          >
            <Copy className="size-4" />
            {copy?.label ?? 'Copy text'}
            {copyShortcutText ? (
              <DropdownMenuShortcut>{copyShortcutText}</DropdownMenuShortcut>
            ) : null}
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem
            checked={important?.checked?.() ?? false}
            disabled={important?.disabled}
            onCheckedChange={() => run(important)}
          >
            <Sparkles
              className={cn(
                'size-4',
                important?.checked?.() ? 'text-amber-500' : '',
              )}
            />
            {important?.label ?? 'Important'}
            {importantShortcutText ? (
              <DropdownMenuShortcut>{importantShortcutText}</DropdownMenuShortcut>
            ) : null}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function MessageBlockInner({
  message,
  threadId,
  threadSubject,
  threadParticipant,
  accordionOpen,
  onAccordionOpenChange,
}: {
  message: { id: string; from: string; date: string; body: string }
  threadId: string
  threadSubject: string
  threadParticipant: string
  accordionOpen: boolean
  onAccordionOpenChange: (open: boolean) => void
}) {
  const commands = useMemo(
    () => createMessageCommands(message.id, threadId),
    [message.id, threadId],
  )
  useRegisterCommands(commands, {
    ctx: {
      messageId: message.id,
      threadId,
      messageFrom: message.from,
      threadSubject,
      threadParticipant,
    },
  })
  const important = useMailStore(s => s.messageImportant[message.id] ?? false)

  const senderInitials = getMessageSenderInitials(message.from)

  return (
    <Collapsible
      open={accordionOpen}
      onOpenChange={onAccordionOpenChange}
      className="w-full min-w-0"
    >
      <article className="min-w-0">
        <div
          className={cn(
            'flex w-full min-w-0 items-start gap-2 rounded-md px-2 py-2 sm:px-4 sm:py-3',
            'text-foreground transition-colors',
            'hover:bg-muted/40',
            accordionOpen && 'mb-2',
          )}
        >
          <CollapsibleTrigger
            type="button"
            className={cn(
              'flex min-w-0 flex-1 gap-3 rounded-md py-1 text-left outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <Avatar
              size="lg"
              className="mt-0.5 shrink-0"
              aria-hidden
            >
              <AvatarFallback className="text-xs font-medium">
                {senderInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <header className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold">{message.from}</span>
                <time className="text-xs text-muted-foreground" dateTime={message.date}>
                  {new Date(message.date).toLocaleString()}
                </time>
                {important ? (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
                    Important
                  </span>
                ) : null}
              </header>
              <p className="mt-1 text-sm font-medium leading-snug text-foreground">
                {threadSubject}
              </p>
            </div>
          </CollapsibleTrigger>
          <MessageActionsToolbar messageId={message.id} />
        </div>
        <CollapsibleContent>
          <div className="px-4 pb-3">
            <div className="ml-[3.25rem]">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                {message.body}
              </pre>
            </div>
          </div>
        </CollapsibleContent>
      </article>
    </Collapsible>
  )
}

function MessageBlock({
  message,
  threadId,
  threadSubject,
  threadParticipant,
  accordionOpen,
  onAccordionOpenChange,
}: {
  message: { id: string; from: string; date: string; body: string }
  threadId: string
  threadSubject: string
  threadParticipant: string
  accordionOpen: boolean
  onAccordionOpenChange: (open: boolean) => void
}) {
  return (
    <CommandScope
      scope="message"
      ctx={{
        messageId: message.id,
        threadId,
        messageFrom: message.from,
        threadSubject,
        threadParticipant,
      }}
      anchor={{ threadId, messageId: message.id }}
    >
      <MessageBlockInner
        message={message}
        threadId={threadId}
        threadSubject={threadSubject}
        threadParticipant={threadParticipant}
        accordionOpen={accordionOpen}
        onAccordionOpenChange={onAccordionOpenChange}
      />
    </CommandScope>
  )
}

function MessageViewPlaceholder() {
  return (
    <>
      <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-2">
        <span className="text-sm text-muted-foreground">Commandry Mail</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p className="text-sm">Select a thread to view</p>
        </div>
      </div>
    </>
  )
}

function MessageViewInner({ threadId }: { threadId: string }) {
  const thread = getThreadById(threadId)
  const tid = thread?.id ?? '__none__'

  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    () => thread?.messages.at(-1)?.id ?? null,
  )

  const reply = useCommand(`thread.${tid}.reply`)
  const forward = useCommand(`thread.${tid}.forward`)
  const archive = useCommand(`thread.${tid}.archive`)
  const del = useCommand(`thread.${tid}.delete`)
  const star = useCommand(`thread.${tid}.star`)
  const labelCmd = useCommand(`thread.${tid}.label`)

  const run = useCallback((cmd: ReturnType<typeof useCommand>) => {
    if (cmd && !cmd.disabled) void cmd.execute()
  }, [])

  if (!thread) {
    return (
      <>
        <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-2">
          <span className="text-sm text-muted-foreground">Commandry Mail</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Thread not found</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-2">
        <div className="flex items-center gap-1">
          <ToolbarButton
            label={reply?.label ?? 'Reply'}
            shortcut={reply?.shortcut}
            onClick={() => run(reply)}
          >
            <Reply className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label={forward?.label ?? 'Forward'}
            shortcut={forward?.shortcut}
            onClick={() => run(forward)}
          >
            <Forward className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label={archive?.label ?? 'Archive'}
            shortcut={archive?.shortcut}
            onClick={() => run(archive)}
          >
            <Archive className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label={del?.label ?? 'Delete'}
            shortcut={del?.shortcut}
            onClick={() => run(del)}
          >
            <Trash2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label={star?.label ?? 'Star'}
            shortcut={star?.shortcut}
            onClick={() => run(star)}
          >
            <Star
              className={`size-4 ${star?.checked?.() ? 'fill-amber-400 text-amber-400' : ''}`}
            />
          </ToolbarButton>
          {labelCmd?.options ? (
            <div className="relative ml-1 inline-flex items-center gap-1">
              <Tag className="size-4 text-muted-foreground" aria-hidden />
              <select
                className="max-w-[140px] rounded-md border bg-background px-2 py-1 text-xs"
                value={labelCmd.value?.() ?? 'none'}
                onChange={e => void labelCmd.execute({ value: e.target.value })}
              >
                {labelCmd.options.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b px-5 py-4">
          <h1 className="text-lg font-semibold">{thread.subject}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {thread.messages.length} message{thread.messages.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {thread.messages.map(m => (
            <MessageBlock
              key={m.id}
              message={m}
              threadId={thread.id}
              threadSubject={thread.subject}
              threadParticipant={thread.participant}
              accordionOpen={expandedMessageId === m.id}
              onAccordionOpenChange={open => {
                setExpandedMessageId(prev => {
                  if (open) return m.id
                  return prev === m.id ? null : prev
                })
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export function MessageView() {
  const selectedThreadId = useMailStore(s => s.selectedThreadId)
  const selectedMailboxId = useMailStore(s => s.selectedMailboxId)
  useMailStore(s => s.epoch)
  const thread = selectedThreadId ? getThreadById(selectedThreadId) : undefined

  return (
    <div className="flex h-[100dvh] flex-col">
      <CommandScope
        scope="thread-list"
        ctx={{ mailboxId: selectedMailboxId }}
        activateOn="mount"
      >
        {thread && selectedThreadId ? (
          <CommandScope
            scope="thread-item"
            ctx={{
              threadId: thread.id,
              threadSubject: thread.subject,
              threadParticipant: thread.participant,
            }}
            activateOn="mount"
            anchor={{ threadId: thread.id }}
          >
            <MessageViewInner key={selectedThreadId} threadId={selectedThreadId} />
          </CommandScope>
        ) : (
          <MessageViewPlaceholder />
        )}
      </CommandScope>
    </div>
  )
}
