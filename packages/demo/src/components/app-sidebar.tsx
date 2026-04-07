"use client"

import * as React from "react"
import { useMemo } from "react"
import { CommandScope, useRegisterCommands } from "commandry/react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  FileText,
  Inbox,
  Mail,
  Send,
  Star,
  Trash2,
  CommandIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { MAILBOXES, LABELS, type MailboxId, type Thread } from "@/lib/mock-data"
import {
  setSelectedMailboxId,
  setSelectedThreadId,
  markThreadRead,
  toggleThreadSelection,
  selectThreadRange,
  useMailStore,
} from "@/lib/store"
import {
  getThreadsForMailbox,
  isThreadUnread,
  formatThreadTime,
} from "@/lib/thread-utils"
import { createThreadCommands, createThreadListCommands } from "@/features/threads/commands"
import { BulkToolbar } from "@/components/bulk-toolbar"

const ICONS: Record<string, LucideIcon> = {
  inbox: Inbox,
  star: Star,
  send: Send,
  file: FileText,
  trash: Trash2,
}

const SHORTCUT_KEYS: Record<string, string> = {
  inbox: "G then I",
  sent: "G then S",
  drafts: "G then D",
  trash: "G then T",
}

function ThreadListBulkCommandsRegistrar() {
  const commands = useMemo(() => createThreadListCommands(), [])
  useRegisterCommands(commands)
  return null
}

function unreadForMailbox(mailboxId: MailboxId): number {
  if (mailboxId === "trash" || mailboxId === "sent" || mailboxId === "drafts")
    return 0
  return getThreadsForMailbox(mailboxId).filter((t) =>
    isThreadUnread(t.id, t.mailboxId)
  ).length
}

function ThreadRow({
  thread,
  selected,
  multiSelected,
  isMultiSelecting,
  visibleThreadIds,
}: {
  thread: Thread
  selected: boolean
  multiSelected: boolean
  isMultiSelecting: boolean
  visibleThreadIds: string[]
}) {
  const commands = useMemo(
    () => createThreadCommands(thread.id),
    [thread.id]
  )
  useRegisterCommands(commands, {
    ctx: {
      threadId: thread.id,
      threadSubject: thread.subject,
      threadParticipant: thread.participant,
    },
  })

  const unread = isThreadUnread(thread.id, thread.mailboxId)
  const labelId = useMailStore((s) => s.threadLabelId[thread.id])
  const starredOverride = useMailStore((s) => s.threadStarred[thread.id])
  const starred = starredOverride ?? thread.mailboxId === "starred"
  const label = LABELS.find((l) => l.id === (labelId ?? "none"))
  const lastClickedThreadId = useMailStore((s) => s.lastClickedThreadId)
  const currentSelectedThreadId = useMailStore((s) => s.selectedThreadId)

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault()
      const anchor = lastClickedThreadId ?? currentSelectedThreadId
      selectThreadRange(visibleThreadIds, anchor, thread.id)
    } else if (e.metaKey || e.ctrlKey || isMultiSelecting) {
      e.preventDefault()
      toggleThreadSelection(thread.id)
    } else {
      setSelectedThreadId(thread.id)
      markThreadRead(thread.id)
    }
  }

  const highlighted = multiSelected || (selected && !isMultiSelecting)

  return (
    <button
      type="button"
      data-testid="thread-row"
      data-thread-id={thread.id}
      onClick={handleClick}
      className={`flex w-full items-start border-b text-left text-sm leading-tight last:border-b-0 transition-colors ${
        highlighted
          ? "bg-primary/10 text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      } ${multiSelected ? "ring-1 ring-inset ring-primary/30" : ""}`}
    >
      {isMultiSelecting ? (
        <div className="flex shrink-0 items-center justify-center self-stretch py-3 pl-3">
          <div
            className={`flex size-4 items-center justify-center rounded-full border transition-colors ${
              multiSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40"
            }`}
          >
            {multiSelected ? (
              <svg className="size-3" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <div className="flex w-full items-center gap-2">
          <span
            className={`min-w-0 flex-1 truncate ${unread ? "font-semibold" : ""}`}
          >
            {thread.participant}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {formatThreadTime(thread.lastMessageAt)}
          </span>
        </div>
        <span className={`truncate ${unread ? "font-medium" : ""}`}>
          {thread.subject}
        </span>
        <div className="flex w-full items-center gap-2">
          <span className="line-clamp-2 flex-1 text-xs text-muted-foreground whitespace-break-spaces">
            {thread.preview}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {label && label.id !== "none" ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${label.color}`}
              >
                {label.name}
              </span>
            ) : null}
            {unread ? (
              <Mail className="size-3.5 text-blue-400" aria-label="Unread" />
            ) : null}
            {starred ? (
              <Star
                className="size-3.5 fill-amber-400 text-amber-400"
                aria-label="Starred"
              />
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const selectedMailboxId = useMailStore((s) => s.selectedMailboxId)
  const selectedThreadId = useMailStore((s) => s.selectedThreadId)
  const selectedThreadIds = useMailStore((s) => s.selectedThreadIds)
  useMailStore((s) => s.epoch)

  const { setOpen } = useSidebar()
  const threads = getThreadsForMailbox(selectedMailboxId)
  const visibleThreadIds = useMemo(() => threads.map((t) => t.id), [threads])
  const isMultiSelecting = selectedThreadIds.length > 0

  const activeMailbox = MAILBOXES.find((m) => m.id === selectedMailboxId)

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* Icon sidebar — mailboxes */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="md:h-8 md:p-0">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <CommandIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Commandry Mail</span>
                  <span className="truncate text-xs">Demo</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {MAILBOXES.map((box) => {
                  const Icon = ICONS[box.icon]
                  const unread = unreadForMailbox(box.id)
                  const shortcut = SHORTCUT_KEYS[box.id]
                  const tooltipLabel = `${box.name}${unread > 0 ? ` (${unread})` : ""}${shortcut ? `  ${shortcut}` : ""}`
                  return (
                    <SidebarMenuItem key={box.id}>
                      <SidebarMenuButton
                        tooltip={tooltipLabel}
                        onClick={() => {
                          const threads = getThreadsForMailbox(box.id)
                          setSelectedMailboxId(box.id, threads[0]?.id)
                          setOpen(true)
                        }}
                        isActive={selectedMailboxId === box.id}
                        className="px-2.5 md:px-2"
                      >
                        <Icon className="size-4" />
                        <span>{box.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Thread list sidebar */}
      <Sidebar collapsible="none" className="relative hidden flex-1 md:flex">
        <SidebarHeader className="gap-0 p-0">
          <div className="flex w-full items-center justify-between px-4 py-3">
            <div className="text-base font-medium text-foreground">
              {activeMailbox?.name ?? "Mail"}
            </div>
            <span className="text-xs text-muted-foreground">
              {threads.length} thread{threads.length === 1 ? "" : "s"}
            </span>
          </div>
          <SidebarInput placeholder="Search threads..." className="h-9 rounded-none border-x-0 bg-transparent shadow-none focus-visible:ring-0" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0 pt-0">
            <SidebarGroupContent>
              <CommandScope
                scope="thread-list"
                ctx={{ mailboxId: selectedMailboxId }}
                activateOn="mount"
              >
                <ThreadListBulkCommandsRegistrar />
                {threads.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No threads
                  </p>
                ) : (
                  threads.map((t) => (
                    <CommandScope
                      key={t.id}
                      scope="thread-item"
                      ctx={{
                        threadId: t.id,
                        threadSubject: t.subject,
                        threadParticipant: t.participant,
                      }}
                      anchor={{ threadId: t.id }}
                    >
                      <ThreadRow
                        thread={t}
                        selected={selectedThreadId === t.id}
                        multiSelected={selectedThreadIds.includes(t.id)}
                        isMultiSelecting={isMultiSelecting}
                        visibleThreadIds={visibleThreadIds}
                      />
                    </CommandScope>
                  ))
                )}
              </CommandScope>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <BulkToolbar />
      </Sidebar>
    </Sidebar>
  )
}
