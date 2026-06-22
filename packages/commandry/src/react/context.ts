import { createContext } from 'react'
import type { CommandRegistry } from '../core/registry'
import type { Platform } from '../core/types'
import type { SequenceEngine } from '../core/sequence'

export interface CommandryContextValue {
  registry: CommandRegistry
  platform: Platform
  sequenceEngine: SequenceEngine
}

export interface RegionContextValue {
  region: string | null
  regionStack: string[]
}

export const CommandryContext = createContext<CommandryContextValue | null>(null)
export const RegionContext = createContext<RegionContextValue>({
  region: null,
  regionStack: [],
})

/** @deprecated Use {@link RegionContext} */
export const ScopeContext = RegionContext
