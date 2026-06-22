'use client'

import { useEffect } from 'react'
import { CommandryProvider } from 'commandry/react'
import { useRegisterCommands } from 'commandry/react'
import { keepInBulkSelectionMode } from 'commandry'
import { globalCommands } from '@/features/global/commands'
import { registry } from '@/lib/commandry'
import { applyThemeClass, getMailState, subscribeMailStore } from '@/lib/store'

function GlobalCommands() {
  useRegisterCommands(globalCommands)
  return null
}

function ThemeSync() {
  useEffect(() => {
    applyThemeClass(getMailState().theme)
    return subscribeMailStore(() => {
      applyThemeClass(getMailState().theme)
    })
  }, [])
  return null
}

function BulkModeSync() {
  useEffect(() => {
    function syncBulkMode() {
      const modes = new Set(registry.getModes())
      if (getMailState().selectedThreadIds.length > 0) {
        modes.add('bulk')
      } else {
        modes.delete('bulk')
      }
      registry.setModes(modes)
    }
    syncBulkMode()
    return subscribeMailStore(syncBulkMode)
  }, [])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CommandryProvider
      registry={registry}
      preferBulkShortcuts={() => getMailState().selectedThreadIds.length > 0}
      shortcutBindingFilterWhileBulk={keepInBulkSelectionMode}
    >
      <ThemeSync />
      <BulkModeSync />
      <GlobalCommands />
      {children}
    </CommandryProvider>
  )
}
