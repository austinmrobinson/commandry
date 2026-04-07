import { CommandRegistry } from './core/registry'
import type {
  CommandDefinitionMap,
  RuntimeScopeConfig,
} from './core/types'

export interface CreateCommandryOptions {
  /** Nested scope names for shortcut depth and dev-time validation; mirrors your UI regions. */
  scopes?: Record<string, RuntimeScopeConfig>
}

/**
 * Creates a {@link CommandRegistry} and a pass-through `defineCommands` helper.
 * React bindings (`CommandryProvider`, `CommandScope`, hooks) are imported from `commandry/react`.
 *
 * The `TScopes` type parameter is reserved for future typed scope keys / merged context; today,
 * pass the same shape as `options.scopes` in your own `Scopes` type for documentation and inference in your app.
 */
export function createCommandry<
  TScopes extends Record<string, unknown> = Record<string, unknown>,
>(options?: CreateCommandryOptions) {
  const registry = new CommandRegistry({
    scopes: options?.scopes,
  })

  function defineCommands<T extends CommandDefinitionMap>(commands: T): T {
    return commands
  }

  return {
    registry,
    defineCommands,
  }
}
