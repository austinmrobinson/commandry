'use client'

import { useEffect, useCallback } from 'react'
import { Archive, CommandIcon, MailOpen, Star, Trash2, X } from 'lucide-react'
import { showToast, showSuccessToast } from '@/lib/show-toast'
import {
  useMailStore,
  clearMultiSelection,
  bulkArchiveThreads,
  bulkDeleteThreads,
  bulkStarThreads,
  bulkMarkReadThreads,
  setCommandPaletteOpen,
} from '@/lib/store'

function IconButton({
  onClick,
  label,
  children,
  variant = 'default',
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex size-7 items-center justify-center rounded-md transition-colors ${
        variant === 'danger'
          ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
          : 'text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  )
}

export function BulkToolbar() {
  const selectedThreadIds = useMailStore((s) => s.selectedThreadIds)
  const count = selectedThreadIds.length

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && count > 0) {
      e.preventDefault()
      e.stopPropagation()
      clearMultiSelection()
    }
  }, [count])

  useEffect(() => {
    if (count === 0) return
    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [count, handleEscape])

  if (count === 0) return null

  return (
    <div
      className="absolute inset-x-2 bottom-2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-150"
      data-testid="bulk-toolbar"
    >
      <div className="flex items-center gap-0.5 rounded-lg border border-zinc-700/60 bg-zinc-900/95 px-1.5 py-1 shadow-lg backdrop-blur-sm">
        <span className="px-1.5 text-[11px] font-medium tabular-nums text-zinc-300">
          {count} selected
        </span>

        <div className="mx-0.5 h-4 w-px bg-zinc-700/60" />

        <IconButton
          onClick={() => {
            bulkArchiveThreads(selectedThreadIds)
            showSuccessToast(`${count} thread${count > 1 ? 's' : ''} archived`, Archive)
          }}
          label="Archive"
        >
          <Archive className="size-3.5" />
        </IconButton>

        <IconButton
          onClick={() => {
            bulkStarThreads(selectedThreadIds)
            showToast(`${count} thread${count > 1 ? 's' : ''} starred`, Star)
          }}
          label="Star"
        >
          <Star className="size-3.5" />
        </IconButton>

        <IconButton
          onClick={() => {
            bulkMarkReadThreads(selectedThreadIds)
            showToast(`${count} thread${count > 1 ? 's' : ''} marked as read`, MailOpen)
          }}
          label="Mark read"
        >
          <MailOpen className="size-3.5" />
        </IconButton>

        <IconButton
          onClick={() => {
            bulkDeleteThreads(selectedThreadIds)
            showToast(`${count} thread${count > 1 ? 's' : ''} deleted`, Trash2)
          }}
          label="Delete"
          variant="danger"
        >
          <Trash2 className="size-3.5" />
        </IconButton>

        <div className="flex-1" />

        <div className="mx-0.5 h-4 w-px bg-zinc-700/60" />

        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          title="Commands (⌘K)"
          className="flex size-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
        >
          <CommandIcon className="size-3.5" />
        </button>

        <div className="mx-0.5 h-4 w-px bg-zinc-700/60" />

        <button
          type="button"
          onClick={clearMultiSelection}
          title="Clear selection (Esc)"
          className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
