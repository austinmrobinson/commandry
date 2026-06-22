import { useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import {
  DATA_COMMANDRY_ACTIVE,
  DATA_COMMANDRY_HOVER,
  DATA_COMMANDRY_MESSAGE_ID,
  DATA_COMMANDRY_REGION,
  DATA_COMMANDRY_THREAD_ID,
} from '../dom/region-attributes'
import {
  deleteRegionContext,
  setRegionContext,
} from '../dom/region-context-store'
import { CommandryContext, RegionContext } from './context'

export interface CommandRegionAnchor {
  threadId?: string
  messageId?: string
}

export interface CommandRegionProps {
  region: string
  ctx: Record<string, unknown>
  /** When true, region participates in resolution without pointer hover. */
  active?: boolean
  /** When false, pointer resolution skips this region (default true). */
  hover?: boolean
  anchor?: CommandRegionAnchor
  children: ReactNode
}

export function CommandRegion({
  region,
  ctx,
  active = false,
  hover = true,
  anchor,
  children,
}: CommandRegionProps) {
  useContext(CommandryContext)
  const parentRegionCtx = useContext(RegionContext)
  const ref = useRef<HTMLDivElement>(null)

  const regionStack = useMemo(
    () => [...parentRegionCtx.regionStack, region],
    [parentRegionCtx.regionStack, region],
  )

  const regionContextValue = useMemo(
    () => ({ region, regionStack }),
    [region, regionStack],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setRegionContext(el, ctx)
    return () => {
      deleteRegionContext(el)
    }
  }, [ctx])

  return (
    <RegionContext.Provider value={regionContextValue}>
      <div
        ref={ref}
        data-commandry-region={region}
        {...(active ? { [DATA_COMMANDRY_ACTIVE]: 'true' } : {})}
        {...(!hover ? { [DATA_COMMANDRY_HOVER]: 'false' } : {})}
        {...(anchor?.threadId != null && anchor.threadId !== ''
          ? { [DATA_COMMANDRY_THREAD_ID]: anchor.threadId }
          : {})}
        {...(anchor?.messageId != null && anchor.messageId !== ''
          ? { [DATA_COMMANDRY_MESSAGE_ID]: anchor.messageId }
          : {})}
      >
        {children}
      </div>
    </RegionContext.Provider>
  )
}
