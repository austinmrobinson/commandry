import { Slot } from '@radix-ui/react-slot'
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { CommandryContext, ScopeContext } from './context'

/** Optional ids on the scope root for UIs that need to disambiguate duplicate scopes (e.g. context menus). */
export interface CommandScopeAnchor {
  threadId?: string
  messageId?: string
}

export interface CommandScopeProps {
  scope: string
  ctx: Record<string, unknown>
  activateOn?: 'mount' | 'pointer' | 'focus' | 'both'
  /** Rendered as `data-commandry-thread-id` / `data-commandry-message-id` on the scope root. */
  anchor?: CommandScopeAnchor
  /**
   * Merge props onto the single child instead of rendering a wrapper `div`.
   * The child must be a React element that can hold a ref (native element or `forwardRef`).
   */
  asChild?: boolean
  /** Applied to the default wrapper `div`, or merged onto the child when `asChild` is true. */
  className?: string
  children: ReactNode
}

export function CommandScope({
  scope,
  ctx,
  activateOn = 'pointer',
  anchor,
  asChild = false,
  className,
  children,
}: CommandScopeProps) {
  const commandryCtx = useContext(CommandryContext)
  if (!commandryCtx) {
    throw new Error('CommandScope must be used within a CommandryProvider')
  }
  const { registry } = commandryCtx
  const parentScopeCtx = useContext(ScopeContext)
  const ref = useRef<HTMLDivElement | null>(null)
  const mountHolderIdRef = useRef<number | null>(null)
  const pointerHolderIdRef = useRef<number | null>(null)
  const ctxSyncKeyRef = useRef<string>('')

  const scopeStack = useMemo(
    () => [...parentScopeCtx.scopeStack, scope],
    [parentScopeCtx.scopeStack, scope],
  )

  const scopeContextValue = useMemo(
    () => ({ scope, scopeStack }),
    [scope, scopeStack],
  )

  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (activateOn === 'mount') {
      mountHolderIdRef.current = registry.pushScope(scope, ctxRef.current)
      return () => {
        if (mountHolderIdRef.current != null) {
          registry.removeScopeHolder(mountHolderIdRef.current)
          mountHolderIdRef.current = null
        }
        ctxSyncKeyRef.current = ''
      }
    }

    const activatePointer = () => {
      pointerHolderIdRef.current = registry.pushScope(scope, ctxRef.current)
    }
    const deactivatePointer = () => {
      const id = pointerHolderIdRef.current
      if (id != null) {
        registry.removeScopeHolder(id)
        pointerHolderIdRef.current = null
      }
    }

    if (activateOn === 'pointer' || activateOn === 'both') {
      el.addEventListener('pointerenter', activatePointer)
      el.addEventListener('pointerleave', deactivatePointer)
    }
    if (activateOn === 'focus' || activateOn === 'both') {
      el.addEventListener('focusin', activatePointer)
      el.addEventListener('focusout', deactivatePointer)
    }

    return () => {
      el.removeEventListener('pointerenter', activatePointer)
      el.removeEventListener('pointerleave', deactivatePointer)
      el.removeEventListener('focusin', activatePointer)
      el.removeEventListener('focusout', deactivatePointer)
      deactivatePointer()
    }
  }, [scope, activateOn, registry])

  useEffect(() => {
    if (activateOn !== 'mount') return
    const id = mountHolderIdRef.current
    if (id == null) return
    const nextKey = JSON.stringify(ctx)
    if (nextKey === ctxSyncKeyRef.current) return
    ctxSyncKeyRef.current = nextKey
    registry.updateScopeHolderContext(id, ctx)
  }, [activateOn, scope, registry, ctx])

  const dataProps = {
    'data-commandry-scope': scope,
    ...(anchor?.threadId != null && anchor.threadId !== ''
      ? { 'data-commandry-thread-id': anchor.threadId }
      : {}),
    ...(anchor?.messageId != null && anchor.messageId !== ''
      ? { 'data-commandry-message-id': anchor.messageId }
      : {}),
  } as const

  return (
    <ScopeContext.Provider value={scopeContextValue}>
      {asChild ? (
        <Slot ref={ref} className={className} {...dataProps}>
          {children}
        </Slot>
      ) : (
        <div ref={ref} className={className} {...dataProps}>
          {children}
        </div>
      )}
    </ScopeContext.Provider>
  )
}
