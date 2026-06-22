import { CommandRegistry } from './core/registry'
import type { Platform } from './core/types'

export interface CreateRegistryOptions {
  platform?: Platform
}

/**
 * Creates a {@link CommandRegistry}. React bindings (`CommandryProvider`, `CommandRegion`, hooks)
 * are imported from `commandry/react`.
 */
export function createRegistry(options?: CreateRegistryOptions): CommandRegistry {
  return new CommandRegistry(options)
}
