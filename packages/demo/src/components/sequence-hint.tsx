'use client'

import { displayCombo } from 'commandry'
import { useCommandry, useShortcutState } from 'commandry/react'

export function SequenceHint() {
  const { buffer, pending } = useShortcutState()
  const { platform } = useCommandry()

  if (buffer.length === 0) return null

  const typed = buffer.map(combo => displayCombo(combo, platform)).join(' → ')
  const next = pending
    .map(p => p.label)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ')

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 max-w-xs rounded-lg border border-amber-500/30 bg-zinc-950/95 px-3 py-2 text-xs text-zinc-200 shadow-lg backdrop-blur-sm">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">
        Sequence
      </div>
      <p className="font-mono text-zinc-100">{typed}</p>
      {next ? <p className="mt-1 line-clamp-2 text-zinc-500">Then: {next}</p> : null}
    </div>
  )
}
