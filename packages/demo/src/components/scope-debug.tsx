'use client'

import { useMemo, useSyncExternalStore } from 'react'
import type { Platform, ResolvedCommand, Shortcut, ShortcutField } from 'commandry'
import { displayShortcut, filterCommandsForSurface } from 'commandry'
import { useActiveScopes, useCommandry, useCommands } from 'commandry/react'
import { useMailStore } from '@/lib/store'
import { Circle, Layers } from 'lucide-react'

function formatShortcutField(shortcut: ShortcutField | undefined, platform: Platform): string {
  if (!shortcut || shortcut.length === 0) return ''
  const first = shortcut[0]
  const isMultiple = Array.isArray(first) && Array.isArray(first[0])
  if (!isMultiple) return displayShortcut(shortcut as Shortcut, platform)
  return (shortcut as Shortcut[]).map(s => displayShortcut(s, platform)).join(' · ')
}

function sortForDebug(commands: ResolvedCommand[]): ResolvedCommand[] {
  return [...commands].sort((a, b) => {
    const ga = a.group ?? ''
    const gb = b.group ?? ''
    if (ga !== gb) return ga.localeCompare(gb)
    return a.label.localeCompare(b.label)
  })
}

function ActionRows({
  commands,
  platform,
  maxRows,
}: {
  commands: ResolvedCommand[]
  platform: Platform
  maxRows: number
}) {
  const sorted = useMemo(() => sortForDebug(commands), [commands])
  const shown = sorted.slice(0, maxRows)
  const rest = sorted.length - shown.length

  return (
    <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-[10px] leading-tight text-zinc-400">
      {shown.map(c => {
        const sc = formatShortcutField(c.shortcut, platform)
        return (
          <li key={c.id} className="truncate" title={`${c.id}${c.scope ? ` · ${c.scope}` : ''}`}>
            <span className="text-zinc-200">{c.label}</span>
            {c.scope ? <span className="text-zinc-600"> · {c.scope}</span> : null}
            {sc ? <span className="ml-1 text-zinc-500">({sc})</span> : null}
          </li>
        )
      })}
      {rest > 0 ? <li className="text-zinc-600">… and {rest} more</li> : null}
    </ul>
  )
}

export function ScopeDebug() {
  const scopes = useActiveScopes()
  const { registry, platform } = useCommandry()
  const commands = useCommands()
  const selectedThreadIds = useMailStore(s => s.selectedThreadIds)
  const selectedThreadId = useMailStore(s => s.selectedThreadId)
  const paletteOpen = useMailStore(s => s.commandPaletteOpen)

  const listSelection = useMemo(
    () => ({ selectedThreadIds, selectedThreadId }),
    [selectedThreadIds, selectedThreadId],
  )

  /** Re-subscribe when scope stack or any scope context changes (not only scope *names*). */
  const liveActivation = useSyncExternalStore(
    registry.subscribe,
    () => registry.getActiveScopeSnapshot(),
    () => registry.getActiveScopeSnapshot(),
  )

  const snapshotPin = useSyncExternalStore(
    registry.subscribe,
    () => registry.getActiveScopeSnapshotPin(),
    () => null,
  )

  const liveFiltered = useMemo(() => {
    return filterCommandsForSurface(commands, liveActivation, listSelection)
  }, [commands, listSelection, liveActivation])

  const cmdkFiltered = useMemo(() => {
    if (!paletteOpen) return null
    const activation = snapshotPin ?? liveActivation
    return filterCommandsForSurface(commands, activation, listSelection)
  }, [paletteOpen, snapshotPin, commands, listSelection, liveActivation])

  const hasScopes = scopes.length > 0
  const activeScope = hasScopes ? scopes[scopes.length - 1] : null

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-40 font-mono text-[11px]">
      <div className="group/scope flex flex-col items-end gap-0">
        <div
          className={`max-h-0 w-[min(22rem,calc(100vw-2rem))] overflow-hidden opacity-0 transition-all duration-200 group-hover/scope:max-h-[min(24rem,70vh)] group-hover/scope:overflow-y-auto group-hover/scope:opacity-100 group-hover/scope:mb-2`}
        >
          <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/98 p-3 text-left shadow-xl backdrop-blur-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500/90">
              Live (stack + pointer)
            </div>
            <p className="text-[10px] text-zinc-500">
              Same filter as shortcuts / this pill&apos;s registry state —{' '}
              <span className="text-zinc-400">{liveFiltered.length}</span> actions
            </p>
            <ActionRows commands={liveFiltered} platform={platform} maxRows={35} />

            {paletteOpen && cmdkFiltered ? (
              <>
                <div className="mt-3 border-t border-zinc-800 pt-3 text-[10px] font-semibold uppercase tracking-wide text-sky-500/90">
                  CmdK (frozen at open)
                </div>
                <p className="text-[10px] text-zinc-500">
                  Pin from when the palette opened —{' '}
                  <span className="text-zinc-400">{cmdkFiltered.length}</span> actions. Compare if focus
                  stole pointer scopes.
                </p>
                <ActionRows commands={cmdkFiltered} platform={platform} maxRows={35} />
              </>
            ) : null}

            <p className="mt-2 border-t border-zinc-800 pt-2 text-[9px] leading-snug text-zinc-600">
              Context menu uses its own capture at right-click; it should match live pointer scope at
              that moment.
            </p>
          </div>
        </div>

        <div
          className={`flex h-8 items-center rounded-full border border-zinc-700/80 bg-zinc-950/95 shadow-lg backdrop-blur-sm transition-all duration-200 ${hasScopes ? 'gap-2 pl-2 pr-2 hover:pl-3.5' : 'px-2'}`}
        >
          {hasScopes ? (
            <>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="flex max-w-0 items-center gap-1.5 opacity-0 transition-all duration-200 group-hover/scope:max-w-64 group-hover/scope:opacity-100">
                  {scopes.slice(0, -1).map((s, i) => (
                    <span key={`${s}-${i}`} className="flex shrink-0 items-center gap-1.5">
                      {i > 0 ? <span className="text-zinc-700">/</span> : null}
                      <span className="text-zinc-500">{s}</span>
                    </span>
                  ))}
                  {scopes.length > 1 ? <span className="text-zinc-700">/</span> : null}
                </div>
                <span className="shrink-0 tabular-nums text-zinc-200">{activeScope}</span>
                <span className="shrink-0 text-zinc-600" title="Actions visible for live scope filter">
                  ·{liveFiltered.length}
                </span>
              </div>
              <Layers className="size-3.5 shrink-0 text-zinc-500" />
            </>
          ) : (
            <Circle className="size-3.5 shrink-0 text-zinc-600" />
          )}
        </div>
      </div>
    </div>
  )
}
