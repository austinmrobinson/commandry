import { getRegionContext } from './region-context-store'
import {
  DATA_COMMANDRY_ACTIVE,
  DATA_COMMANDRY_HOVER,
  DATA_COMMANDRY_MESSAGE_ID,
  DATA_COMMANDRY_REGION,
  DATA_COMMANDRY_THREAD_ID,
} from './region-attributes'

export interface ActiveContext {
  /** Outermost → innermost region names from the DOM chain. */
  regions: string[]
  /** Entity ids from anchor attributes on region roots. */
  anchors: Record<string, string>
  /** Merged context from region roots along the chain. */
  ctx: Record<string, unknown>
  /** Innermost region root element, if any. */
  element: HTMLElement | null
}

export const EMPTY_ACTIVE_CONTEXT: ActiveContext = {
  regions: [],
  anchors: {},
  ctx: {},
  element: null,
}

export interface ResolveActiveContextOptions {
  /** Pin overrides all other resolution strategies. */
  pin?: ActiveContext | null
  /** Event target or element to walk from (focus / pointer). */
  target?: EventTarget | null
  /** Use pointer position when no suitable target is provided. */
  usePointer?: boolean
  /** Only consider regions with {@link DATA_COMMANDRY_ACTIVE}. */
  activeOnly?: boolean
}

function readAnchors(el: HTMLElement): Record<string, string> {
  const anchors: Record<string, string> = {}
  const threadId = el.getAttribute(DATA_COMMANDRY_THREAD_ID)
  const messageId = el.getAttribute(DATA_COMMANDRY_MESSAGE_ID)
  if (threadId) anchors.threadId = threadId
  if (messageId) anchors.messageId = messageId
  return anchors
}

function isHoverEnabled(el: HTMLElement): boolean {
  return el.getAttribute(DATA_COMMANDRY_HOVER) !== 'false'
}

function isRegionActive(el: HTMLElement): boolean {
  return el.getAttribute(DATA_COMMANDRY_ACTIVE) === 'true'
}

/** Build {@link ActiveContext} from a region root element and its DOM ancestors. */
export function buildContextFromElement(inner: HTMLElement): ActiveContext {
  const chain: HTMLElement[] = []
  let el: HTMLElement | null = inner
  while (el) {
    if (el.hasAttribute(DATA_COMMANDRY_REGION)) {
      chain.unshift(el)
    }
    el = el.parentElement
  }

  const regions: string[] = []
  const anchors: Record<string, string> = {}
  const ctx: Record<string, unknown> = {}

  for (const node of chain) {
    const region = node.getAttribute(DATA_COMMANDRY_REGION)
    if (!region) continue
    regions.push(region)
    Object.assign(ctx, getRegionContext(node))
    Object.assign(anchors, readAnchors(node))
  }

  return {
    regions,
    anchors,
    ctx,
    element: inner,
  }
}

function findRegionRoot(from: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = from
  while (el) {
    if (el.hasAttribute(DATA_COMMANDRY_REGION)) return el
    el = el.parentElement
  }
  return null
}

function resolveFromFocus(): ActiveContext | null {
  if (typeof document === 'undefined') return null
  const active = document.activeElement
  if (!active || !(active instanceof HTMLElement)) return null
  const root = findRegionRoot(active)
  if (!root) return null
  return buildContextFromElement(root)
}

let lastPointerX = 0
let lastPointerY = 0

/** Updated by {@link CommandryProvider} on pointer movement. */
export function updatePointerPosition(x: number, y: number): void {
  lastPointerX = x
  lastPointerY = y
}

function resolveFromPointer(): ActiveContext | null {
  if (typeof document === 'undefined') return null
  if (typeof document.elementFromPoint !== 'function') return null
  const el = document.elementFromPoint(lastPointerX, lastPointerY)
  if (!el || !(el instanceof HTMLElement)) return null
  const root = findRegionRoot(el)
  if (!root || !isHoverEnabled(root)) return null
  return buildContextFromElement(root)
}

function resolveFromTarget(target: EventTarget | null): ActiveContext | null {
  if (!target || !(target instanceof HTMLElement)) return null
  const root = findRegionRoot(target)
  if (!root) return null
  return buildContextFromElement(root)
}

function resolveFromActiveRegions(): ActiveContext | null {
  if (typeof document === 'undefined') return null
  const nodes = document.querySelectorAll<HTMLElement>(
    `[${DATA_COMMANDRY_REGION}][${DATA_COMMANDRY_ACTIVE}="true"]`,
  )
  if (nodes.length === 0) return null

  let best: HTMLElement | null = null
  let bestDepth = -1
  for (const node of nodes) {
    let depth = 0
    let el: HTMLElement | null = node
    while (el) {
      if (el.hasAttribute(DATA_COMMANDRY_REGION)) depth++
      el = el.parentElement
    }
    if (depth > bestDepth) {
      bestDepth = depth
      best = node
    }
  }

  return best ? buildContextFromElement(best) : null
}

/**
 * Resolve the active command region chain for shortcuts, palettes, and menus.
 *
 * Order: pin → focus-within → active regions → pointer (hover-enabled) → empty.
 */
export function resolveActiveContext(
  options: ResolveActiveContextOptions = {},
): ActiveContext {
  if (options.pin) {
    return options.pin
  }

  if (options.activeOnly) {
    return resolveFromActiveRegions() ?? EMPTY_ACTIVE_CONTEXT
  }

  if (options.target) {
    const fromTarget = resolveFromTarget(options.target)
    if (fromTarget && fromTarget.regions.length > 0) return fromTarget
  }

  const fromFocus = resolveFromFocus()
  if (fromFocus && fromFocus.regions.length > 0) return fromFocus

  const fromActive = resolveFromActiveRegions()
  if (fromActive && fromActive.regions.length > 0) return fromActive

  if (options.usePointer !== false) {
    const fromPointer = resolveFromPointer()
    if (fromPointer && fromPointer.regions.length > 0) return fromPointer
  }

  return EMPTY_ACTIVE_CONTEXT
}

/** Walk to the parent region element in the DOM (for context menu bubbling). */
export function getParentRegionElement(element: HTMLElement): HTMLElement | null {
  let el = element.parentElement
  while (el) {
    if (el.hasAttribute(DATA_COMMANDRY_REGION)) return el
    el = el.parentElement
  }
  return null
}

/** Deepest region under an event target (for context menus). */
export function resolveRegionFromTarget(target: EventTarget | null): {
  region: string | null
  regionElement: HTMLElement | null
  threadId: string | null
  messageId: string | null
  context: ActiveContext
} {
  if (!target || !(target instanceof HTMLElement)) {
    return {
      region: null,
      regionElement: null,
      threadId: null,
      messageId: null,
      context: EMPTY_ACTIVE_CONTEXT,
    }
  }

  const root = findRegionRoot(target)
  if (!root) {
    return {
      region: null,
      regionElement: null,
      threadId: null,
      messageId: null,
      context: EMPTY_ACTIVE_CONTEXT,
    }
  }

  const context = buildContextFromElement(root)
  return {
    region: context.regions[context.regions.length - 1] ?? null,
    regionElement: root,
    threadId: context.anchors.threadId ?? null,
    messageId: context.anchors.messageId ?? null,
    context,
  }
}

export function getRegionDepthInContext(
  region: string | null,
  context: ActiveContext,
): number {
  if (!region) return -1
  const idx = context.regions.indexOf(region)
  return idx === -1 ? -1 : idx
}
