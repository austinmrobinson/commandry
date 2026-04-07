'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import { useCommandry, useShortcutDisplay } from 'commandry/react'
import { getMailState } from '@/lib/store'
import type { ContextMenuModel, ResolvedCommand } from 'commandry'
import {
  buildContextMenuModelFromScope,
  resolveCommandryScopeFromTarget,
} from 'commandry'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

/** Mount-only / shell scopes — highlighting the wrapper would cover most of the UI */
const CONTEXT_MENU_SKIP_SCOPE_HIGHLIGHT = new Set(['app', 'mailbox', 'thread-list'])

function ActionMenuItem({ cmd }: { cmd: ResolvedCommand }) {
  const Icon = cmd.icon as ComponentType<{ className?: string }> | undefined
  const shortcutText = useShortcutDisplay(cmd.shortcut, 'all')
  return (
    <ContextMenuItem
      disabled={cmd.disabled}
      onClick={() => void cmd.execute()}
    >
      {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      <span className="flex-1 truncate">{cmd.label}</span>
      {shortcutText ? <ContextMenuShortcut>{shortcutText}</ContextMenuShortcut> : null}
    </ContextMenuItem>
  )
}

function ToggleMenuItem({ cmd }: { cmd: ResolvedCommand }) {
  const Icon = cmd.icon as ComponentType<{ className?: string }> | undefined
  const shortcutText = useShortcutDisplay(cmd.shortcut, 'all')
  return (
    <ContextMenuCheckboxItem
      disabled={cmd.disabled}
      checked={cmd.checked?.() ?? false}
      onCheckedChange={() => void cmd.execute()}
    >
      {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      <span className="flex-1 truncate">{cmd.label}</span>
      {shortcutText ? <ContextMenuShortcut>{shortcutText}</ContextMenuShortcut> : null}
    </ContextMenuCheckboxItem>
  )
}

function RadioSubmenu({ cmd }: { cmd: ResolvedCommand }) {
  const Icon = cmd.icon as ComponentType<{ className?: string }> | undefined
  const shortcutText = useShortcutDisplay(cmd.shortcut, 'all')
  const value = cmd.value?.() ?? 'none'
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger disabled={cmd.disabled}>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        <span className="flex-1 truncate">{cmd.label}</span>
        {shortcutText ? <ContextMenuShortcut>{shortcutText}</ContextMenuShortcut> : null}
      </ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuRadioGroup
          value={value}
          onValueChange={v => void cmd.execute({ value: v as string })}
        >
          {cmd.options?.map(opt => {
            const OptIcon = opt.icon as ComponentType<{ className?: string }> | undefined
            return (
              <ContextMenuRadioItem key={opt.id} value={opt.id}>
                {OptIcon ? <OptIcon className="size-4" /> : null}
                {opt.label}
              </ContextMenuRadioItem>
            )
          })}
        </ContextMenuRadioGroup>
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}

function CommandMenuRow({ cmd }: { cmd: ResolvedCommand }) {
  if (cmd.kind === 'radio' && cmd.options?.length) return <RadioSubmenu cmd={cmd} />
  if (cmd.kind === 'toggle') return <ToggleMenuItem cmd={cmd} />
  return <ActionMenuItem cmd={cmd} />
}

function AppContextMenuContent({ pinned }: { pinned: ContextMenuModel | null }) {
  const groups = pinned?.groups ?? new Map<string, ResolvedCommand[]>()
  const empty = pinned?.empty ?? true

  return (
    <ContextMenuContent className="max-h-[min(360px,var(--available-height))]">
      {empty ? (
        <p className="px-2 py-3 text-center text-xs text-muted-foreground">No actions available</p>
      ) : (
        [...groups.entries()].map(([heading, items], gi) => (
          <ContextMenuGroup key={heading}>
            {gi > 0 ? <ContextMenuSeparator /> : null}
            <ContextMenuLabel>{heading}</ContextMenuLabel>
            {items.map(cmd => (
              <CommandMenuRow key={cmd.id} cmd={cmd} />
            ))}
          </ContextMenuGroup>
        ))
      )}
    </ContextMenuContent>
  )
}

export function AppContextMenu({ children }: { children: ReactNode }) {
  const { registry } = useCommandry()
  const [pinnedModel, setPinnedModel] = useState<ContextMenuModel | null>(null)
  const contextMenuHighlightRef = useRef<HTMLElement | null>(null)
  /** Synchronous guard from Base UI: may flip true before our contextmenu handler runs. */
  const contextMenuOpenRef = useRef(false)
  /** Latest pinned model — avoid stale closure when deciding whether to ignore a repeat contextmenu. */
  const pinnedModelRef = useRef<ContextMenuModel | null>(null)
  useEffect(() => {
    pinnedModelRef.current = pinnedModel
  }, [pinnedModel])

  const clearContextMenuHighlight = useCallback(() => {
    contextMenuHighlightRef.current?.removeAttribute('data-context-menu-open')
    contextMenuHighlightRef.current = null
  }, [])

  useEffect(() => () => clearContextMenuHighlight(), [clearContextMenuHighlight])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      contextMenuOpenRef.current = open
      if (!open) {
        setPinnedModel(null)
        clearContextMenuHighlight()
      }
    },
    [clearContextMenuHighlight],
  )

  const handleContextMenuCapture = useCallback(
    (e: React.MouseEvent) => {
      // If the root already marked open but we never pinned (openChange can run before this handler),
      // still build the model. Only skip when the menu is open *and* we already pinned this session.
      if (contextMenuOpenRef.current && pinnedModelRef.current !== null) {
        return
      }
      clearContextMenuHighlight()
      const { scope, scopeElement, threadId, messageId } =
        resolveCommandryScopeFromTarget(e.target)
      const bulkThreadSelection = getMailState().selectedThreadIds.length > 0
      const snapshot = registry.getCommands()
      setPinnedModel(
        buildContextMenuModelFromScope({
          commands: snapshot,
          menuScope: scope,
          scopeTree: registry.scopeTree,
          bulkSelectionActive: bulkThreadSelection,
          menuAnchorThreadId: bulkThreadSelection ? null : threadId,
          menuAnchorMessageId: bulkThreadSelection ? null : messageId,
        }),
      )
      if (
        scope &&
        scopeElement &&
        !CONTEXT_MENU_SKIP_SCOPE_HIGHLIGHT.has(scope)
      ) {
        scopeElement.setAttribute('data-context-menu-open', '')
        contextMenuHighlightRef.current = scopeElement
      }
    },
    [clearContextMenuHighlight, registry],
  )

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger
        className="min-h-full min-w-0 w-full flex-1"
        onContextMenuCapture={handleContextMenuCapture}
      >
        {children}
      </ContextMenuTrigger>
      <AppContextMenuContent pinned={pinnedModel} />
    </ContextMenu>
  )
}
