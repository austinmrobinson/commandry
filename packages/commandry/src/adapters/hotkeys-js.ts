import type { Shortcut, ShortcutAdapter, ShortcutBinding } from '../core/types'

function shortcutToHotkeysFormat(shortcut: Shortcut): string {
  if (shortcut.length > 1) {
    return shortcut.map(combo => comboToString(combo)).join(',')
  }
  return comboToString(shortcut[0])
}

function comboToString(combo: string[]): string {
  return combo
    .map(token => {
      const lower = token.toLowerCase()
      if (lower === 'mod') return 'command'
      if (lower === 'meta') return 'command'
      return lower
    })
    .join('+')
}

interface HotkeysInstance {
  (key: string, handler: (e: KeyboardEvent) => void): void
  unbind(key: string, handler: (e: KeyboardEvent) => void): void
}

export function hotkeysJsAdapter(hotkeys: HotkeysInstance): ShortcutAdapter {
  return {
    bind(bindings: ShortcutBinding[], execute: (commandId: string) => void | Promise<void>) {
      const unbinders: Array<() => void> = []

      for (const binding of bindings) {
        if (binding.external) continue
        const key = shortcutToHotkeysFormat(binding.shortcut)
        const handler = (e: KeyboardEvent) => {
          e.preventDefault()
          void execute(binding.commandId)
        }
        hotkeys(key, handler)
        unbinders.push(() => hotkeys.unbind(key, handler))
      }

      return () => {
        for (const unbind of unbinders) unbind()
      }
    },
  }
}
