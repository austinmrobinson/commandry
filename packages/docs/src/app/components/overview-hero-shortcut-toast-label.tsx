"use client"

/**
 * Overview hero action toasts: repeat count as a small pill beside the label (inside the toast).
 */
export function HeroShortcutToastLabel({
  label,
  count,
}: {
  label: string
  count: number
}) {
  if (count <= 1) {
    return <span className="block">{label}</span>
  }

  return (
    <span className="inline-flex max-w-full items-center justify-center gap-2">
      <span className="min-w-0">{label}</span>
      <span
        className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-background/20 px-1 font-mono text-[10px] font-semibold leading-none text-background tabular-nums ring-1 ring-background/25"
        aria-hidden
      >
        {count}
      </span>
    </span>
  )
}
