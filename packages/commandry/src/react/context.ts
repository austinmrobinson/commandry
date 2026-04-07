import { createContext } from 'react'
import type { CommandRegistry } from '../core/registry'
import type { Platform } from '../core/types'
import type { SequenceEngine } from '../core/sequence'

export interface CommandryContextValue {
  registry: CommandRegistry
  platform: Platform
  sequenceEngine: SequenceEngine
}

export interface ScopeContextValue {
  scope: string | null
  scopeStack: string[]
}

export const CommandryContext = createContext<CommandryContextValue | null>(null)
export const ScopeContext = createContext<ScopeContextValue>({
  scope: null,
  scopeStack: [],
})
