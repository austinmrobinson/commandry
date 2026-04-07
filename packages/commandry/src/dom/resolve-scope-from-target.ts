/** `CommandScope` sets this on its root element. */
export const DATA_COMMANDRY_SCOPE = 'data-commandry-scope'
/** Optional; set when `CommandScope` receives `anchor={{ threadId }}`. */
export const DATA_COMMANDRY_THREAD_ID = 'data-commandry-thread-id'
/** Optional; set when `CommandScope` receives `anchor={{ messageId }}`. */
export const DATA_COMMANDRY_MESSAGE_ID = 'data-commandry-message-id'

export interface ResolvedCommandryScopeTarget {
  scope: string | null
  scopeElement: HTMLElement | null
  threadId: string | null
  messageId: string | null
}

/**
 * Walk ancestors from `target` and return the nearest element carrying
 * {@link DATA_COMMANDRY_SCOPE} (deepest / innermost scope under the event target).
 */
export function resolveCommandryScopeFromTarget(
  target: EventTarget | null,
): ResolvedCommandryScopeTarget {
  let el = target as HTMLElement | null
  while (el) {
    const scope = el.getAttribute(DATA_COMMANDRY_SCOPE)
    if (scope) {
      return {
        scope,
        scopeElement: el,
        threadId: el.getAttribute(DATA_COMMANDRY_THREAD_ID),
        messageId: el.getAttribute(DATA_COMMANDRY_MESSAGE_ID),
      }
    }
    el = el.parentElement
  }
  return { scope: null, scopeElement: null, threadId: null, messageId: null }
}
