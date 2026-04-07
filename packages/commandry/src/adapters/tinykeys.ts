import type { Shortcut, ShortcutAdapter, ShortcutBinding } from '../core/types'

function shortcutToTinykeysFormat(shortcut: Shortcut): string {
  return shortcut
    .map(combo =>
      combo
        .map(token => {
          const lower = token.toLowerCase()
          if (lower === 'mod') return '$mod'
          if (lower === 'ctrl') return 'Control'
          if (lower === 'alt') return 'Alt'
          if (lower === 'shift') return 'Shift'
          if (lower === 'meta') return 'Meta'
          return token
        })
        .join('+'),
    )
    .join(' ')
}

type TinykeysBindFn = (
  target: Window | HTMLElement,
  keymap: Record<string, (e: KeyboardEvent) => void>,
) => () => void

export function tinykeysAdapter(tinykeys: TinykeysBindFn): ShortcutAdapter {
  return {
    bind(bindings: ShortcutBinding[], execute: (commandId: string) => void | Promise<void>) {
      const keymap: Record<string, (e: KeyboardEvent) => void> = {}

      for (const binding of bindings) {
        if (binding.external) continue
        const key = shortcutToTinykeysFormat(binding.shortcut)
        keymap[key] = (e: KeyboardEvent) => {
          e.preventDefault()
          void execute(binding.commandId)
        }
      }

      return tinykeys(window, keymap)
    },
  }
}
