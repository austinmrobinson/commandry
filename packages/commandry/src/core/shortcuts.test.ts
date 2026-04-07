import { describe, it, expect } from 'vitest'
import {
  normalizeCombo,
  matchesCombo,
  displayShortcut,
  displayCombo,
  shortcutToParts,
  detectPlatform,
  eventToCombo,
  combosMatch,
} from './shortcuts'

function createKeyEvent(
  key: string,
  mods: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: mods.ctrl ?? false,
    altKey: mods.alt ?? false,
    shiftKey: mods.shift ?? false,
    metaKey: mods.meta ?? false,
  })
}

describe('normalizeCombo', () => {
  it('replaces mod with meta on mac', () => {
    expect(normalizeCombo(['mod', 's'], 'mac')).toEqual(['meta', 's'])
  })

  it('replaces mod with ctrl on windows', () => {
    expect(normalizeCombo(['mod', 's'], 'windows')).toEqual(['ctrl', 's'])
  })

  it('sorts modifiers to canonical order', () => {
    expect(normalizeCombo(['shift', 'ctrl', 'a'], 'windows')).toEqual(['ctrl', 'shift', 'a'])
  })

  it('lowercases all tokens', () => {
    expect(normalizeCombo(['Ctrl', 'S'], 'windows')).toEqual(['ctrl', 's'])
  })
})

describe('matchesCombo', () => {
  it('matches simple key', () => {
    const event = createKeyEvent('a')
    expect(matchesCombo(event, ['a'], 'mac')).toBe(true)
  })

  it('matches modifier + key', () => {
    const event = createKeyEvent('s', { meta: true })
    expect(matchesCombo(event, ['mod', 's'], 'mac')).toBe(true)
  })

  it('rejects events with extra modifiers', () => {
    const event = createKeyEvent('s', { meta: true, shift: true })
    expect(matchesCombo(event, ['mod', 's'], 'mac')).toBe(false)
  })

  it('rejects events missing required modifiers', () => {
    const event = createKeyEvent('s')
    expect(matchesCombo(event, ['mod', 's'], 'mac')).toBe(false)
  })

  it('matches complex combo', () => {
    const event = createKeyEvent('p', { meta: true, shift: true })
    expect(matchesCombo(event, ['mod', 'shift', 'p'], 'mac')).toBe(true)
  })
})

describe('displayShortcut', () => {
  it('formats Mac shortcuts with symbols', () => {
    expect(displayShortcut([['mod', 's']], 'mac')).toBe('⌘S')
  })

  it('formats Windows shortcuts with text', () => {
    expect(displayShortcut([['mod', 's']], 'windows')).toBe('Ctrl+S')
  })

  it('formats sequences with arrow', () => {
    expect(displayShortcut([['g'], ['i']], 'mac')).toBe('G → I')
  })

  it('formats special keys', () => {
    expect(displayCombo(['backspace'], 'mac')).toBe('⌫')
    expect(displayCombo(['enter'], 'mac')).toBe('⏎')
    expect(displayCombo(['escape'], 'mac')).toBe('Esc')
  })

  it('formats complex Mac combos', () => {
    expect(displayShortcut([['mod', 'shift', 'p']], 'mac')).toBe('⌘⇧P')
  })
})

describe('shortcutToParts', () => {
  it('returns structured parts', () => {
    const parts = shortcutToParts([['mod', 's']], 'mac')
    expect(parts).toHaveLength(1)
    expect(parts[0].step).toBe(0)
    expect(parts[0].parts).toHaveLength(2)
    expect(parts[0].parts[0]).toEqual({ glyph: '⌘', type: 'modifier' })
    expect(parts[0].parts[1]).toEqual({ glyph: 'S', type: 'key' })
  })

  it('handles multi-step sequences', () => {
    const parts = shortcutToParts([['g'], ['i']], 'mac')
    expect(parts).toHaveLength(2)
    expect(parts[0].step).toBe(0)
    expect(parts[1].step).toBe(1)
  })
})

describe('eventToCombo', () => {
  it('extracts combo from keyboard event', () => {
    const event = createKeyEvent('s', { meta: true })
    expect(eventToCombo(event, 'mac')).toEqual(['meta', 's'])
  })

  it('extracts plain key', () => {
    const event = createKeyEvent('g')
    expect(eventToCombo(event, 'mac')).toEqual(['g'])
  })
})

describe('combosMatch', () => {
  it('matches identical combos', () => {
    expect(combosMatch(['ctrl', 's'], ['ctrl', 's'])).toBe(true)
  })

  it('matches combos regardless of order', () => {
    expect(combosMatch(['s', 'ctrl'], ['ctrl', 's'])).toBe(true)
  })

  it('rejects different combos', () => {
    expect(combosMatch(['ctrl', 's'], ['ctrl', 'a'])).toBe(false)
  })

  it('rejects combos of different lengths', () => {
    expect(combosMatch(['ctrl'], ['ctrl', 's'])).toBe(false)
  })
})

describe('detectPlatform', () => {
  it('returns a valid platform', () => {
    const p = detectPlatform()
    expect(['mac', 'windows', 'linux']).toContain(p)
  })
})
