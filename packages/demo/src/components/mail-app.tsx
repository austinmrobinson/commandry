'use client'

import dynamic from 'next/dynamic'

const MailShell = dynamic(
  () => import('@/components/mail-shell').then(m => ({ default: m.MailShell })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100dvh] items-center justify-center bg-zinc-950 font-sans text-sm text-zinc-500">
        Loading…
      </div>
    ),
  },
)

export function MailApp() {
  return <MailShell />
}
