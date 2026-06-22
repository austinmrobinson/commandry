import { filterCommandsForContext } from './filter-commands-for-context'
import type { ActiveContext } from '../dom/resolve-active-context'
import type { ResolvedCommand, CommandSurfaceListSelection } from './types'

/**
 * Filter palette/search results using a pinned or live {@link ActiveContext}.
 */
export function filterCommandsForSurface(
  commands: ResolvedCommand[],
  context: ActiveContext,
  listSelection: CommandSurfaceListSelection,
  modes?: ReadonlySet<string>,
): ResolvedCommand[] {
  const bulkSelectionActive = listSelection.selectedThreadIds.length > 0

  return filterCommandsForContext(commands, context, {
    modes,
    bulkSelectionActive,
    bulkRegion: 'thread-item',
    matchAnchor: true,
  })
}
