import type {
  KeyCombo,
  Platform,
  SequenceState,
  ShortcutBinding,
} from './types'
import { combosMatch, eventToCombo, matchesCombo } from './shortcuts'

export interface HandleKeyDownOptions {
  /** When true, bindings with `bulkAction: true` win ties before scope depth. */
  preferBulkShortcuts?: boolean
}

export class SequenceEngine {
  private state: SequenceState
  private timeout: number
  private platform: Platform
  private listeners: Set<(state: SequenceState) => void>

  constructor(options: { timeout?: number; platform: Platform }) {
    this.state = { buffer: [], pending: [], timeoutId: null }
    this.timeout = options.timeout ?? 800
    this.platform = options.platform
    this.listeners = new Set()
  }

  handleKeyDown(
    event: KeyboardEvent,
    bindings: ShortcutBinding[],
    execute: (commandId: string) => void | Promise<void>,
    options?: HandleKeyDownOptions,
  ): boolean {
    const preferBulk = options?.preferBulkShortcuts === true
    const combo = eventToCombo(event, this.platform)

    // Skip pure modifier keypresses
    if (combo.every(k => ['ctrl', 'alt', 'shift', 'meta'].includes(k))) {
      return false
    }

    if (this.state.buffer.length > 0) {
      const handled = this.continueSequence(combo, execute, preferBulk)
      if (handled) event.preventDefault()
      return handled
    }

    const singleMatches = bindings.filter(
      b => b.shortcut.length === 1 && matchesCombo(event, b.shortcut[0], this.platform),
    )

    const sequenceStarts = bindings.filter(
      b => b.shortcut.length > 1 && matchesCombo(event, b.shortcut[0], this.platform),
    )

    if (sequenceStarts.length > 0) {
      this.enterSequence(combo, sequenceStarts)
      event.preventDefault()
      return true
    }

    if (singleMatches.length > 0) {
      const winner = this.resolveByScope(singleMatches, preferBulk)
      execute(winner.commandId)
      event.preventDefault()
      return true
    }

    return false
  }

  private enterSequence(combo: KeyCombo, pending: ShortcutBinding[]): void {
    this.clearTimeout()
    this.state = {
      buffer: [combo],
      pending,
      timeoutId: setTimeout(() => this.reset(), this.timeout),
    }
    this.notifyListeners()
  }

  private continueSequence(
    combo: KeyCombo,
    execute: (commandId: string) => void | Promise<void>,
    preferBulk: boolean,
  ): boolean {
    this.clearTimeout()

    const newBuffer = [...this.state.buffer, combo]
    const stepIndex = newBuffer.length - 1

    const stillPending = this.state.pending.filter(
      b =>
        b.shortcut.length > stepIndex &&
        combosMatch(b.shortcut[stepIndex], combo),
    )

    const exactMatches = stillPending.filter(
      b => b.shortcut.length === newBuffer.length,
    )

    if (exactMatches.length > 0) {
      const winner = this.resolveByScope(exactMatches, preferBulk)
      execute(winner.commandId)
      this.reset()
      return true
    }

    if (stillPending.length > 0) {
      this.state = {
        buffer: newBuffer,
        pending: stillPending,
        timeoutId: setTimeout(() => this.reset(), this.timeout),
      }
      this.notifyListeners()
      return true
    }

    this.reset()
    return false
  }

  private resolveByScope(matches: ShortcutBinding[], preferBulk: boolean): ShortcutBinding {
    return [...matches].sort((a, b) => {
      if (preferBulk) {
        const ba = a.bulkAction === true ? 1 : 0
        const bb = b.bulkAction === true ? 1 : 0
        const bulkDiff = bb - ba
        if (bulkDiff !== 0) return bulkDiff
      }
      const depthDiff = (b.scopeDepth ?? 0) - (a.scopeDepth ?? 0)
      if (depthDiff !== 0) return depthDiff
      return b.registeredAt - a.registeredAt
    })[0]
  }

  reset(): void {
    this.clearTimeout()
    this.state = { buffer: [], pending: [], timeoutId: null }
    this.notifyListeners()
  }

  getState(): { buffer: KeyCombo[]; pending: ShortcutBinding[] } {
    return { buffer: this.state.buffer, pending: this.state.pending }
  }

  subscribe(listener: (state: SequenceState) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private clearTimeout(): void {
    if (this.state.timeoutId != null) {
      clearTimeout(this.state.timeoutId)
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}
