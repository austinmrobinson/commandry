const regionContextStore = new WeakMap<HTMLElement, Record<string, unknown>>()

export function setRegionContext(
  element: HTMLElement,
  ctx: Record<string, unknown>,
): void {
  regionContextStore.set(element, ctx)
}

export function getRegionContext(element: HTMLElement): Record<string, unknown> {
  return regionContextStore.get(element) ?? {}
}

export function deleteRegionContext(element: HTMLElement): void {
  regionContextStore.delete(element)
}
