import type {
  KeyCombo,
  KeyToken,
  Platform,
  Shortcut,
  ShortcutPart,
  ShortcutStep,
} from './types'

const MODIFIERS = new Set(['ctrl', 'alt', 'shift', 'meta'])
const MODIFIER_ORDER = ['ctrl', 'alt', 'shift', 'meta']

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'windows'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'mac'
  if (ua.includes('linux')) return 'linux'
  return 'windows'
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

export function normalizeCombo(combo: KeyCombo, platform: Platform): KeyCombo {
  const modifiers: string[] = []
  const keys: string[] = []

  for (const token of combo) {
    const normalized = token.toLowerCase()
    if (normalized === 'mod') {
      modifiers.push(platform === 'mac' ? 'meta' : 'ctrl')
    } else if (MODIFIERS.has(normalized)) {
      modifiers.push(normalized)
    } else {
      keys.push(normalized)
    }
  }

  modifiers.sort((a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b))
  return [...modifiers, ...keys]
}

export function normalizeShortcut(shortcut: Shortcut, platform: Platform): Shortcut {
  return shortcut.map(combo => normalizeCombo(combo, platform))
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export function matchesCombo(
  event: KeyboardEvent,
  combo: KeyCombo,
  platform: Platform,
): boolean {
  const normalized = normalizeCombo(combo, platform)

  const activeModifiers: Record<string, boolean> = {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  }

  const expectedModifiers = new Set(normalized.filter(k => MODIFIERS.has(k)))
  const expectedKey = normalized.find(k => !MODIFIERS.has(k))

  for (const mod of expectedModifiers) {
    if (!activeModifiers[mod]) return false
  }

  for (const [mod, active] of Object.entries(activeModifiers)) {
    if (active && !expectedModifiers.has(mod)) return false
  }

  if (!expectedKey) return false
  return event.key.toLowerCase() === expectedKey
}

export function combosMatch(a: KeyCombo, b: KeyCombo): boolean {
  if (a.length !== b.length) return false
  const aSorted = [...a].sort()
  const bSorted = [...b].sort()
  return aSorted.every((val, i) => val === bSorted[i])
}

export function eventToCombo(event: KeyboardEvent, platform: Platform): KeyCombo {
  const combo: KeyToken[] = []
  if (event.ctrlKey) combo.push('ctrl')
  if (event.altKey) combo.push('alt')
  if (event.shiftKey) combo.push('shift')
  if (event.metaKey) combo.push('meta')

  const key = event.key.toLowerCase()
  if (!MODIFIERS.has(key) && key !== 'control') {
    combo.push(key)
  }

  return combo
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

const MODIFIER_GLYPHS_MAC: Record<string, string> = {
  meta: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
}

const MODIFIER_GLYPHS_OTHER: Record<string, string> = {
  meta: 'Win',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
}

const KEY_GLYPHS: Record<string, string> = {
  backspace: '⌫',
  delete: '⌦',
  enter: '⏎',
  escape: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  ' ': 'Space',
  tab: 'Tab',
}

function displayToken(token: string, platform: Platform): string {
  const lower = token.toLowerCase()
  const glyphs = platform === 'mac' ? MODIFIER_GLYPHS_MAC : MODIFIER_GLYPHS_OTHER

  if (lower === 'mod') return glyphs[platform === 'mac' ? 'meta' : 'ctrl']
  if (glyphs[lower]) return glyphs[lower]
  if (KEY_GLYPHS[lower]) return KEY_GLYPHS[lower]
  return token.length === 1 ? token.toUpperCase() : token.charAt(0).toUpperCase() + token.slice(1)
}

export function displayCombo(combo: KeyCombo, platform: Platform): string {
  return combo
    .map(token => displayToken(token, platform))
    .join(platform === 'mac' ? '' : '+')
}

export function displayShortcut(shortcut: Shortcut, platform: Platform): string {
  return shortcut.map(combo => displayCombo(combo, platform)).join(' → ')
}

// ---------------------------------------------------------------------------
// Parts (for custom rendering)
// ---------------------------------------------------------------------------

export function shortcutToParts(shortcut: Shortcut, platform: Platform): ShortcutStep[] {
  return shortcut.map((combo, stepIndex) => ({
    step: stepIndex,
    parts: combo.map((token): ShortcutPart => {
      const isModifier =
        MODIFIERS.has(token.toLowerCase()) || token.toLowerCase() === 'mod'
      return {
        glyph: displayToken(token, platform),
        type: isModifier ? 'modifier' : 'key',
      }
    }),
  }))
}

// ---------------------------------------------------------------------------
// Shortcut string for collision keys
// ---------------------------------------------------------------------------

export function shortcutToString(shortcut: Shortcut, platform: Platform): string {
  return shortcut
    .map(combo => normalizeCombo(combo, platform).join('+'))
    .join(' ')
}
