# Commandry

A TypeScript-first command registry for React apps. Define actions once — surface them in command palettes, context menus, toolbars, dropdowns, and keyboard shortcuts.

Commandry gives you a single source of truth for every action in your app: its label, icon, shortcut, scope, and handler. You write thin UI recipes on top — copy/paste examples built on [shadcn/ui](https://ui.shadcn.com) and [cmdk](https://cmdk.paco.me) that you own and customize.

```
One registry. Every surface. TypeScript-friendly.
```

## Why

Most apps accumulate actions across dozens of files — a shortcut here, a context menu item there, a toolbar button somewhere else. They drift. Labels get inconsistent. Shortcuts collide. Adding a new action means touching five components.

Commandry fixes this:

- **Define once** — a command's label, icon, shortcut, scope, and handler live together
- **Surface anywhere** — the same command appears in cmdk, context menus, toolbars, and responds to keyboard shortcuts automatically
- **Region-aware** — hovering over a list item scopes shortcuts and palette results to that item. Hovering over the canvas scopes to the canvas. Like Figma and Linear.
- **TypeScript-friendly** — command definitions and resolved commands are typed; handler `ctx` is merged region context as `Record<string, unknown>` (narrow in your handlers as needed). Optional `satisfies CommandDefinitionMap` keeps command maps type-safe without boilerplate helpers.
- **Consistent** — dev-only warnings for shortcut collisions and shadowing; optional devtools panel. Planned: `@commandry/eslint-plugin` and `commandry audit` CLI for labels, icons, and shortcuts ([Roadmap](#roadmap))

## Install

```bash
npm install commandry
```

## Quick start

### 1. Create the registry

Regions define *where* commands are active — which part of the UI the user is interacting with. Nesting `<CommandRegion>` in JSX *is* the hierarchy; there is no parallel scope tree config.

`createRegistry()` returns only the **registry**. All React exports (`CommandryProvider`, `CommandRegion`, hooks) come from **`commandry/react`** — import them there, or re-export from your own `@/lib/commandry` module for convenience.

```tsx
// lib/commandry.ts
import { createRegistry } from 'commandry'

/** Optional: union of region tags you use across the app. */
export type Region = 'page' | 'task-list' | 'task-item' | 'canvas' | 'canvas-node'

export const registry = createRegistry()
```

### 2. Define commands where they live

Commands are colocated with the features they belong to — not centralized in one massive file.

```tsx
// features/tasks/commands.ts
import type { CommandDefinitionMap } from 'commandry'

export const taskCommands = {
  'task.create': {
    label: 'New Task',
    icon: Plus,
    shortcut: [['n']],
    group: 'Tasks',
    handler: () => createTask(),
  },
  'task.delete': {
    label: 'Delete Task',
    icon: Trash2,
    shortcut: [['Backspace']],
    group: 'Tasks',
    danger: true,
    handler: ({ ctx }) => deleteTask(ctx.taskId),
  },
} satisfies CommandDefinitionMap
```

Notice there's no `scope` on these commands. They'll inherit their region from whichever `CommandRegion` they're registered inside.

### 3. Wire up the provider

```tsx
// app/layout.tsx
import { CommandryProvider } from 'commandry/react'
import { registry } from '@/lib/commandry'

export default function Layout({ children }) {
  return (
    <CommandryProvider registry={registry}>
      {children}
    </CommandryProvider>
  )
}
```

### 4. Register commands from components

Commands register when a component mounts and unregister when it unmounts. They inherit the region from the nearest `CommandRegion` ancestor — no need to repeat it on every definition.

```tsx
// features/tasks/task-list.tsx
import { CommandRegion, useRegisterCommands } from 'commandry/react'
// Often: re-export these from @/lib/commandry alongside registry
import { taskCommands } from './commands'

function TaskList({ tasks, listId }) {
  return (
    <CommandRegion region="task-list" ctx={{ listId }}>
      {tasks.map(task => (
        <CommandRegion
          key={task.id}
          region="task-item"
          ctx={{ taskId: task.id, task }}
          anchor={{ taskId: task.id }}
        >
          <TaskItem task={task} />
        </CommandRegion>
      ))}
    </CommandRegion>
  )
}

function TaskItem({ task }) {
  useRegisterCommands(taskCommands) // inherits region 'task-item' from parent

  return <TaskRow task={task} />
}
```

That's it. Keyboard shortcuts are active. Scoping works. Now you just need UI to surface the commands — and that's where the recipes come in.

### Stable command maps (`useRegisterCommands`)

`useRegisterCommands` depends on the **`commands` object reference**. Passing a new inline object every render will unregister and re-register repeatedly. Prefer a module-level map with `satisfies CommandDefinitionMap`, or memoize:

```tsx
const commands = useMemo(
  () =>
    ({
      'item.rename': { label: 'Rename', handler: () => rename(id) },
    }) satisfies CommandDefinitionMap,
  [id, rename],
)
useRegisterCommands(commands)
```

### Dynamic command IDs (lists and rows)

For list UIs you can register **per-row commands** with ids that include the row key (e.g. `thread.${threadId}.archive`). Mount `useRegisterCommands(createThreadCommands(threadId))` inside each row so shortcuts and menus target the correct entity. See the demo app under `packages/demo` for a full example.

### Command palette: pinning active context

Opening cmdk often moves focus; pointer-based regions may clear before the palette reads them. Call `registry.pinContext(resolveActiveContext())` **synchronously** when opening the dialog (or rely on the same timing from your state setter), then use `registry.getContextPin()` when filtering `useCommandSearch` results until `registry.clearContextPin()`. The demo calls pin/clear from `setCommandPaletteOpen` in `packages/demo/src/lib/store.ts`.

### Bulk selection and modes

When several items are selected, you may want shortcuts to prefer **bulk** actions. Mark commands with `bulkAction: true`, set `preferBulkShortcuts` on `CommandryProvider`, and call `registry.setModes(['bulk'])` while multi-select is active. Commands can also declare `exceptModes: ['bulk']` to hide non-bulk actions during selection. Palette UIs can filter the same way (see `packages/demo`).

### `CommandRegion` props: `active` and `hover`

- **`hover`** (default `true`) — region participates in pointer-based resolution. Set `false` for mount-only shells (app layout, reading pane).
- **`active`** — region participates in resolution even without pointer hover (selected row, split-pane reading view). Renders `data-commandry-active="true"`.
- **`anchor`** — entity ids on the region root (`data-commandry-thread-id`, etc.) for disambiguating per-row command ids.

Resolution order for shortcuts: pinned context → `:focus-within` → active regions → pointer (hover-enabled regions) → global commands only.

---

## Concepts

### Commands

A command is a single action in your app. It has a unique ID, a label, and a handler. Everything else is optional.

```tsx
type Command = {
  // Display
  label: string | ((args: { ctx }) => string)
  icon?: ComponentType | ((args: { ctx }) => ComponentType)
  description?: string                // subtitle in command palette
  group?: string                      // for grouping in palettes and menus
  keywords?: string[]                 // extra search terms for cmdk
  priority?: number                   // sort weight within group (higher = first)

  // Styling
  danger?: boolean                    // semantic: destructive/irreversible action
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

  // Behavior
  handler: (args: { ctx }) => void | Promise<void>
  shortcut?: Shortcut | Shortcut[]    // single or multiple bindings
  scope?: string                       // region tag; omit to inherit from nearest CommandRegion
  when?: () => boolean                // false = hidden entirely
  enabled?: () => boolean             // false = visible but grayed out

  // Advanced
  shadow?: boolean                    // suppress shortcut shadowing warnings
  external?: boolean                  // shortcut handled elsewhere, skip binding
}
```

#### `danger` and `variant`

These are independent axes. `danger` is a **semantic** flag — this action is destructive or irreversible. `variant` is a **visual** hint — how the command should render as a button.

Every surface understands `danger`: menus show red text, toolbars show red buttons, the palette can style it differently. Only button-like surfaces use `variant` — menus and the palette ignore it.

```tsx
// Danger + outline = red outlined button in toolbars, red text in menus
'task.delete': {
  label: 'Delete Task',
  icon: Trash2,
  danger: true,
  variant: 'outline',
  handler: ({ ctx }) => deleteTask(ctx.taskId),
}

// Primary CTA = filled button in toolbars, normal item in menus
'task.save': {
  label: 'Save Changes',
  icon: Save,
  variant: 'default',
  handler: () => save(),
}

// Just danger, no variant specified
'project.delete': {
  label: 'Delete Project',
  icon: Trash2,
  danger: true,
  handler: ({ ctx }) => deleteProject(ctx.projectId),
}
```

They compose — `variant` controls shape and weight, `danger` controls color and meaning. Neither overrides the other.

#### `when` vs `enabled`

`when` controls **visibility** — if it returns `false`, the command disappears from menus, palettes, and toolbars entirely. The shortcut is unbound. It's as if the command doesn't exist.

`enabled` controls **interactivity** — if it returns `false`, the command is still visible but grayed out and non-interactive. The shortcut is suppressed. Use this for commands that should communicate "this exists, but not right now."

```tsx
'file.save': {
  label: 'Save',
  icon: Save,
  shortcut: [['mod', 's']],
  when: () => isEditor,              // hidden outside the editor entirely
  enabled: () => hasUnsavedChanges,  // visible but grayed out when clean
  handler: () => save(),
}
```

In the resolved command object:

```tsx
const cmd = useCommand('file.save')
cmd.visible   // false if when() returns false
cmd.disabled  // true if enabled() returns false
```

#### Region inference

Commands inherit their region from the nearest `CommandRegion` ancestor where `useRegisterCommands` is called. You don't need to specify `scope` on every command definition — just register them inside the right region boundary.

```tsx
// These commands don't declare a scope
const taskItemCommands = {
  'task.open':   { label: 'Open Task',   handler: ({ ctx }) => open(ctx.taskId) },
  'task.delete': { label: 'Delete Task', handler: ({ ctx }) => del(ctx.taskId) },
} satisfies CommandDefinitionMap

// They inherit 'task-item' from the CommandRegion they're registered in
function TaskItem({ task }) {
  useRegisterCommands(taskItemCommands)
  return (
    <CommandRegion region="task-item" ctx={{ taskId: task.id, task }}>
      <TaskRow />
    </CommandRegion>
  )
}
```

If you set `scope` explicitly on a command, it always wins — the inferred scope is just the default.

```tsx
// This command is registered inside 'task-item' but scoped to 'task-list'
'tasks.create': {
  label: 'New Task',
  scope: 'task-list',  // explicit override
  handler: () => createTask(),
}
```

#### Unscoped commands

Commands without a `scope` — and registered outside any `CommandRegion` — are **global**. They're always active regardless of pointer position or focus.

```tsx
'app.settings': {
  label: 'Settings',
  icon: Settings,
  shortcut: [['mod', ',']],
  handler: () => openSettings(),
}

'app.logout': {
  label: 'Log Out',
  icon: LogOut,
  group: 'Account',
  handler: () => logout(),
}
```

Global commands always appear in the command palette and always respond to their shortcuts, regardless of which scope is active.

#### Multiple shortcuts

Some commands need more than one binding — for platform conventions, accessibility, or legacy support. Pass an array of shortcuts:

```tsx
'editor.copy': {
  label: 'Copy',
  icon: Copy,
  shortcut: [
    [['mod', 'c']],         // ⌘C / Ctrl+C
    [['ctrl', 'Insert']],   // legacy Windows binding
  ],
  scope: 'editor',
  handler: ({ ctx }) => copy(ctx.selection),
}

'task.delete': {
  label: 'Delete Task',
  icon: Trash2,
  shortcut: [
    [['Backspace']],
    [['Delete']],
  ],
  handler: ({ ctx }) => deleteTask(ctx.taskId),
}
```

`useShortcutDisplay` returns the **first** shortcut by default — that's the one shown in menus and tooltips. All bindings are active.

```tsx
useShortcutDisplay(cmd.shortcut)           // first binding: "⌘C"
useShortcutDisplay(cmd.shortcut, 1)        // second binding: "Ctrl+Ins"
useShortcutDisplay(cmd.shortcut, 'all')    // "⌘C, Ctrl+Ins"
```

#### `description` and `priority`

`description` is a subtitle — shown below the label in the command palette for commands that need more context.

```tsx
'data.export': {
  label: 'Export Data',
  description: 'Download as CSV, JSON, or Parquet',
  icon: Download,
  group: 'Data',
  handler: () => openExportDialog(),
}
```

`priority` controls sort order within a group. Higher values appear first. Commands with the same priority sort alphabetically. Default is `0`.

```tsx
'task.create': {
  label: 'New Task',
  group: 'Tasks',
  priority: 100,    // always first in the group
  handler: () => createTask(),
}

'task.archive': {
  label: 'Archive Task',
  group: 'Tasks',
  priority: -10,    // pushed toward the bottom
  handler: ({ ctx }) => archiveTask(ctx.taskId),
}
```

#### `external` flag

Some shortcuts are handled outside Commandry — cmdk opens with `⌘K`, your rich text editor handles `⌘B` internally, etc. Register these as `external` so they still appear in the command palette (and in future audit tooling) without Commandry binding the key.

```tsx
'app.commandPalette': {
  label: 'Command Palette',
  shortcut: [['mod', 'k']],
  external: true,    // don't bind — cmdk handles this
  handler: () => {},
}

'editor.bold': {
  label: 'Bold',
  shortcut: [['mod', 'b']],
  scope: 'editor',
  external: true,    // don't bind — Tiptap handles this
  handler: () => {},
}
```

External commands still show up in the command palette with their shortcut displayed. They don't register a keyboard listener. When the planned CLI audit ships, include them there too; use the optional devtools panel to inspect the live registry during development.

### Command kinds

Most commands are simple actions. But some need richer behavior:

**Toggle** — shows a check indicator, label/icon can flip based on state:

```tsx
'view.sidebar': {
  label: ({ ctx }) => ctx.sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar',
  icon: ({ ctx }) => ctx.sidebarOpen ? PanelLeftClose : PanelLeft,
  shortcut: [['mod', 'b']],
  scope: 'page',
  kind: 'toggle',
  checked: ({ ctx }) => ctx.sidebarOpen,
  handler: () => toggleSidebar(),
}
```

**Radio** — mutually exclusive options, renders as a sub-menu or cmdk page:

```tsx
'view.theme': {
  label: 'Theme',
  icon: Palette,
  scope: 'page',
  kind: 'radio',
  options: [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ],
  value: () => currentTheme,
  handler: ({ value }) => setTheme(value),
}
```

**Parent** — has children, renders as a sub-menu or cmdk page:

```tsx
'editor.turnInto': {
  label: 'Turn into',
  scope: 'editor-block',
  children: {
    'editor.turnInto.h1': {
      label: 'Heading 1',
      icon: Heading1,
      handler: ({ ctx }) => ctx.editor.setHeading(1),
    },
    'editor.turnInto.h2': {
      label: 'Heading 2',
      icon: Heading2,
      handler: ({ ctx }) => ctx.editor.setHeading(2),
    },
    'editor.turnInto.paragraph': {
      label: 'Paragraph',
      icon: Type,
      handler: ({ ctx }) => ctx.editor.setParagraph(),
    },
  },
}
```

### Regions

Regions define where commands are active. Nesting `<CommandRegion>` in JSX *is* the hierarchy — parent/child comes from DOM ancestry, not a parallel config object. You can mirror region names in a TypeScript union for documentation or strictness.

```tsx
type Region = 'page' | 'task-list' | 'task-item'
```

When the user's pointer enters a region, that region and all its ancestors become active:

```
page (always active)
  └── task-list (pointer is here)
       └── task-item[id=3] (pointer is here — innermost)
```

In this state, commands scoped to `task-item`, `task-list`, and `page` are all active. Commands scoped to `canvas` are not. Shortcuts resolve to the deepest matching region — if both `task-item` and `task-list` bind `Backspace`, the `task-item` handler wins.

```tsx
<CommandRegion
  region="task-item"
  ctx={{ taskId: task.id, task }}
  anchor={{ taskId: task.id }}
  hover          // default: pointer resolution
  // active       // always participate (selected row, reading pane)
  // hover={false} // mount-only shell
>
  <TaskRow task={task} />
</CommandRegion>
```

Split-pane apps can use a single `CommandRegion region="task-item" active hover={false}` in the reading pane instead of duplicating list wrappers — see `packages/demo/src/components/message-view.tsx`.

```tsx
// ✅ Nested regions match DOM hierarchy
<CommandRegion region="page" ctx={{ pageId: '1' }}>
  <CommandRegion region="task-list" ctx={{ listId: 'abc' }}>
    ...
  </CommandRegion>
</CommandRegion>
```

#### Context merging

Context merges along the active region chain. A handler in `task-item` receives merged keys from ancestor regions; TypeScript sees `ctx` as `Record<string, unknown>` unless you narrow.

```tsx
// Region chain:
// page       → ctx: { pageId: '1' }
// task-list  → ctx: { listId: 'abc' }
// task-item  → ctx: { taskId: '3', task: { ... } }

// Handler receives all three merged:
handler: ({ ctx }) => {
  ctx.pageId   // '1'       — from page region
  ctx.listId   // 'abc'     — from task-list region
  ctx.taskId   // '3'       — from task-item region
  ctx.task     // { ... }   — from task-item region
}
```

`useRegisterCommands` can also inject context. This is useful for providing dependencies like stores, refs, or API clients that don't come from the DOM hierarchy:

```tsx
useRegisterCommands(editorCommands, {
  ctx: { editor: editorInstance },
})
```

When both `CommandRegion` and `useRegisterCommands` provide context, they merge. `CommandRegion` context is more specific (it varies per-instance), so it takes precedence over `useRegisterCommands` context for overlapping keys.

```tsx
// useRegisterCommands provides:  { editor, defaultFont: 'sans' }
// CommandRegion provides:         { blockId: '7' }
// Handler receives:              { editor, defaultFont: 'sans', blockId: '7' }
```

#### Modes

Flat mode toggles gate commands app-wide without nesting regions:

```tsx
registry.setModes(['bulk'])       // or useSetModes() from commandry/react
registry.getModes()               // ReadonlySet<string>

// On commands:
modes?: string[]        // require ALL listed modes
exceptModes?: string[]  // hide when ANY listed mode is active
```

The provider auto-sets `'palette'` when a context pin is active. The demo sets `'bulk'` when threads are multi-selected.

### Shortcuts

Every shortcut is a sequence of key combos. Most are a single step — `⌘S` is `[['mod', 's']]`. Multi-step sequences like GitHub's `g` then `i` are `[['g'], ['i']]`.

```tsx
type Shortcut = KeyCombo[]     // array of steps
type KeyCombo = KeyToken[]     // keys pressed together in one step

type KeyToken =
  | 'mod'      // ⌘ on Mac, Ctrl on Windows/Linux
  | 'ctrl'     // always Ctrl
  | 'shift'
  | 'alt'      // Alt / Option
  | 'meta'     // always ⌘ / Windows key
  | string     // 'a', 'Enter', 'Backspace', 'ArrowUp', etc.
```

Examples:

```tsx
shortcut: [['mod', 's']]            // ⌘S
shortcut: [['mod', 'shift', 'p']]   // ⌘⇧P
shortcut: [['Backspace']]           // ⌫
shortcut: [['g'], ['i']]            // g then i (sequence)
shortcut: [['g'], ['mod', 'p']]     // g then ⌘P (sequence with modifier)
```

**Sequence mode:** when the user presses the first step of a multi-step shortcut, Commandry enters sequence mode. It waits up to 800ms (configurable) for the next step. If no match, the buffer resets.

```tsx
<CommandryProvider
  registry={commandry.registry}
  sequenceTimeout={800}  // ms, default
>
```

### Async handlers and loading state

Handlers can return a `Promise`. While an async handler is in-flight, the command exposes a `pending` state that your UI can use to show spinners or disable repeat clicks.

```tsx
'data.export': {
  label: 'Export Data',
  icon: Download,
  handler: async ({ ctx }) => {
    const blob = await generateExport(ctx.projectId)
    downloadBlob(blob)
  },
}
```

In the UI:

```tsx
const cmd = useCommand('data.export')

cmd.pending  // true while the handler's promise is unresolved

// In a toolbar button:
<Button onClick={() => cmd.execute()} disabled={cmd.disabled || cmd.pending}>
  {cmd.pending
    ? <Loader2 className="size-4 animate-spin" />
    : <cmd.icon className="size-4" />}
</Button>
```

While pending, the shortcut is suppressed and `cmd.execute()` is a no-op — no double-fires.

### Custom properties

Definitions and `ResolvedCommand` allow **extra keys** (see the index signatures on `BaseCommandDefinition` and `ResolvedCommand`). Use them for roles, analytics ids, layout hints, feature flags, etc.

```tsx
'admin.resetData': {
  label: 'Reset All Data',
  icon: AlertTriangle,
  danger: true,
  requiredRole: 'admin' as const,
  analytics: 'admin_reset_data',
  handler: () => resetData(),
}

const cmd = useCommand('admin.resetData')
// Narrow or cast for your fields:
const role = cmd?.requiredRole as 'admin' | 'editor' | 'viewer' | undefined
```

For stricter typing, use `satisfies CommandDefinitionMap` on your command maps, or use module augmentation in your app.

---

## Hooks

### `useCommand(id)`

Returns a single resolved command with its current state.

```tsx
const cmd = useCommand('task.delete')

cmd.id          // 'task.delete'
cmd.label       // 'Delete Task' (resolved against ctx)
cmd.icon        // Trash2 component (resolved against ctx)
cmd.description // string | undefined
cmd.group       // 'Tasks'
cmd.visible     // boolean — result of when()
cmd.disabled    // boolean — result of enabled()
cmd.pending     // boolean — true while async handler is running
cmd.danger      // true
cmd.variant     // 'outline' | undefined
cmd.shortcut    // [['Backspace']]
cmd.execute()   // calls handler with current ctx
```

### `useCommands(filter?)`

Returns all commands matching a filter, resolved against current region context.

```tsx
const all = useCommands()
const fileCmds = useCommands({ group: 'File' })
const regionCmds = useCommands({ scope: 'task-item' })
const parentCmds = useCommands({ parent: 'editor.turnInto' })
```

Results are sorted by `priority` (descending) within each group, then alphabetically.

### `useCommandSearch(options?)`

Fuzzy search across commands. Matches against `label`, `description`, and `keywords`. Feeds directly into cmdk.

```tsx
const { results, search, setSearch } = useCommandSearch({
  regions: activeContext.regions, // optional — defaults to current context
})
```

For cmdk, if opening the dialog moves focus and drops pointer regions, pass **`regions` from a pinned snapshot** taken synchronously on open (see [Command palette: pinning active context](#command-palette-pinning-active-context)).

### `useRegisterCommands(commands, options?)`

Registers commands for the lifetime of the component. Commands inherit the region from the nearest `CommandRegion` ancestor. Unregistration runs automatically on unmount.

```tsx
useRegisterCommands(editorCommands, {
  ctx: { editor },  // additional context merged into handlers
})
```

Keep the **`commands` reference stable** — see [Stable command maps (`useRegisterCommands`)](#stable-command-maps-useregistercommands).

### `useShortcutDisplay(shortcut, index?)`

Returns a platform-aware display string for a shortcut.

```tsx
useShortcutDisplay([['mod', 's']])         // Mac: "⌘S" / Win: "Ctrl+S"
useShortcutDisplay([['g'], ['i']])         // "G → I"

// For commands with multiple shortcuts:
useShortcutDisplay(cmd.shortcut)           // first binding
useShortcutDisplay(cmd.shortcut, 1)        // second binding
useShortcutDisplay(cmd.shortcut, 'all')    // "⌘C, Ctrl+Ins"
```

### `useShortcutParts(shortcut)`

Returns structured parts for custom rendering.

```tsx
useShortcutParts([['mod', 's']])
// [{ step: 0, parts: [{ glyph: '⌘', type: 'modifier' }, { glyph: 'S', type: 'key' }] }]
```

### `useShortcutState()`

Returns the current state of the sequence engine — use this to build a sequence hint UI.

```tsx
const { buffer, pending } = useShortcutState()

buffer   // KeyCombo[] — steps entered so far
pending  // Command[] — commands that could still match
```

### `useActiveContext()`

Returns the current active context (region chain, anchors, merged ctx).

```tsx
const { regions, anchors, ctx } = useActiveContext()
// regions: ['page', 'task-list', 'task-item']
```

`useActiveScopes()` is deprecated and returns `regions` only.

---

## Recipes

These are copy/paste starting points. Paste them into your project, customize them, own them. They're built on shadcn/ui and cmdk, but you can adapt them to anything.

### Command palette with cmdk pages

Handles simple actions, parent commands (as pages), radio groups, toggles, descriptions, and disabled states.

```tsx
// components/command-palette.tsx
'use client'

import { useState, useMemo } from 'react'
import { Command } from 'cmdk'
import {
  useCommands,
  useCommand,
  useCommandSearch,
  useShortcutDisplay,
  useActiveContext,
} from 'commandry/react'
import { Check, ChevronLeft } from 'lucide-react'
import { groupBy } from 'lodash'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [pages, setPages] = useState<string[]>([])
  const activePage = pages[pages.length - 1]
  const { regions } = useActiveContext()

  const { results, search, setSearch } = useCommandSearch({
    regions,
  })

  const groups = useMemo(
    () => groupBy(results, r => r.group ?? 'Other'),
    [results],
  )

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      onKeyDown={(e) => {
        if (e.key === 'Backspace' && !search && pages.length) {
          e.preventDefault()
          setPages(p => p.slice(0, -1))
        }
      }}
    >
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder="Type a command..."
      />
      <Command.List>
        <Command.Empty>No results.</Command.Empty>

        {!activePage &&
          Object.entries(groups).map(([group, cmds]) => (
            <Command.Group key={group} heading={group}>
              {cmds.map(cmd => (
                <CommandPaletteItem
                  key={cmd.id}
                  command={cmd}
                  onSelect={() => {
                    if (cmd.children || cmd.kind === 'radio') {
                      setPages(p => [...p, cmd.id])
                      setSearch('')
                    } else {
                      cmd.execute()
                      setOpen(false)
                    }
                  }}
                />
              ))}
            </Command.Group>
          ))}

        {activePage && (
          <CommandSubPage
            commandId={activePage}
            onBack={() => setPages(p => p.slice(0, -1))}
            onClose={() => { setOpen(false); setPages([]) }}
          />
        )}
      </Command.List>
    </Command.Dialog>
  )
}

function CommandPaletteItem({ command: cmd, onSelect }) {
  const shortcut = useShortcutDisplay(cmd.shortcut)

  return (
    <Command.Item
      value={`${cmd.label} ${cmd.description ?? ''} ${cmd.keywords?.join(' ') ?? ''}`}
      onSelect={onSelect}
      disabled={cmd.disabled}
      data-disabled={cmd.disabled}
      data-danger={cmd.danger}
    >
      <div className="flex items-center gap-2 flex-1">
        {cmd.icon && <cmd.icon className="size-4 text-muted-foreground" />}
        <div className="flex flex-col">
          <span>{cmd.label}</span>
          {cmd.description && (
            <span className="text-xs text-muted-foreground">{cmd.description}</span>
          )}
        </div>
        {cmd.kind === 'toggle' && cmd.checked?.() && (
          <Check className="size-3.5" />
        )}
      </div>
      {cmd.children || cmd.kind === 'radio' ? (
        <span className="text-xs text-muted-foreground">›</span>
      ) : shortcut ? (
        <kbd className="text-xs text-muted-foreground font-mono">
          {shortcut}
        </kbd>
      ) : null}
    </Command.Item>
  )
}

function CommandSubPage({ commandId, onBack, onClose }) {
  const parent = useCommand(commandId)

  if (parent.kind === 'radio') {
    const currentValue = parent.value()
    return (
      <Command.Group heading={parent.label}>
        <Command.Item onSelect={onBack}>
          <ChevronLeft className="size-4 mr-2" /> Back
        </Command.Item>
        {parent.options.map(opt => (
          <Command.Item
            key={opt.id}
            onSelect={() => { parent.execute({ value: opt.id }); onClose() }}
          >
            {opt.icon && <opt.icon className="size-4 mr-2" />}
            {opt.label}
            {currentValue === opt.id && (
              <Check className="ml-auto size-4" />
            )}
          </Command.Item>
        ))}
      </Command.Group>
    )
  }

  const children = useCommands({ parent: commandId })
  return (
    <Command.Group heading={parent.label}>
      <Command.Item onSelect={onBack}>
        <ChevronLeft className="size-4 mr-2" /> Back
      </Command.Item>
      {children.map(cmd => (
        <CommandPaletteItem
          key={cmd.id}
          command={cmd}
          onSelect={() => { cmd.execute(); onClose() }}
        />
      ))}
    </Command.Group>
  )
}
```

### Context menu

Handles actions, toggles, radio groups, parent commands as sub-menus, disabled states, and dangerous actions.

```tsx
// components/command-context-menu.tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useCommand, useShortcutDisplay } from 'commandry/react'

type MenuEntry = string | '---'

export function CommandContextMenu({
  children,
  commands,
}: {
  children: React.ReactNode
  commands: MenuEntry[]
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {commands.map((entry, i) =>
          entry === '---' ? (
            <ContextMenuSeparator key={i} />
          ) : (
            <CommandContextMenuItem key={entry} id={entry} />
          ),
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

function CommandContextMenuItem({ id }: { id: string }) {
  const cmd = useCommand(id)
  const shortcut = useShortcutDisplay(cmd.shortcut)

  if (!cmd.visible) return null

  // Parent — sub-menu with children
  if (cmd.children) {
    return (
      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={cmd.disabled}>
          {cmd.icon && <cmd.icon className="mr-2 size-4" />}
          {cmd.label}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {cmd.childIds.map(childId => (
            <CommandContextMenuItem key={childId} id={childId} />
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
    )
  }

  // Radio — sub-menu with radio group
  if (cmd.kind === 'radio') {
    return (
      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={cmd.disabled}>
          {cmd.icon && <cmd.icon className="mr-2 size-4" />}
          {cmd.label}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuRadioGroup
            value={cmd.value()}
            onValueChange={v => cmd.execute({ value: v })}
          >
            {cmd.options.map(opt => (
              <ContextMenuRadioItem key={opt.id} value={opt.id}>
                {opt.icon && <opt.icon className="mr-2 size-4" />}
                {opt.label}
              </ContextMenuRadioItem>
            ))}
          </ContextMenuRadioGroup>
        </ContextMenuSubContent>
      </ContextMenuSub>
    )
  }

  // Toggle — checkbox item
  if (cmd.kind === 'toggle') {
    return (
      <ContextMenuCheckboxItem
        checked={cmd.checked()}
        onSelect={() => cmd.execute()}
        disabled={cmd.disabled}
      >
        {cmd.label}
        {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
      </ContextMenuCheckboxItem>
    )
  }

  // Default action
  return (
    <ContextMenuItem
      onSelect={() => cmd.execute()}
      disabled={cmd.disabled}
      className={cmd.danger ? 'text-destructive focus:text-destructive' : ''}
    >
      {cmd.icon && <cmd.icon className="mr-2 size-4" />}
      {cmd.label}
      {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
    </ContextMenuItem>
  )
}
```

**Usage:**

```tsx
<CommandContextMenu
  commands={[
    'task.open',
    'task.duplicate',
    '---',
    'task.priority',    // radio — renders as sub-menu
    'task.favorite',    // toggle — renders with checkbox
    '---',
    'task.delete',      // danger
  ]}
>
  <TaskRow task={task} />
</CommandContextMenu>
```

### Dropdown menu

Same pattern as the context menu, adapted for shadcn's `DropdownMenu`.

```tsx
// components/command-dropdown-menu.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCommand, useShortcutDisplay } from 'commandry/react'

type MenuEntry = string | '---'

export function CommandDropdownMenu({
  trigger,
  commands,
}: {
  trigger: React.ReactNode
  commands: MenuEntry[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent>
        {commands.map((entry, i) =>
          entry === '---' ? (
            <DropdownMenuSeparator key={i} />
          ) : (
            <CommandDropdownMenuItem key={entry} id={entry} />
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CommandDropdownMenuItem({ id }: { id: string }) {
  const cmd = useCommand(id)
  const shortcut = useShortcutDisplay(cmd.shortcut)

  if (!cmd.visible) return null

  // Parent — sub-menu with children
  if (cmd.children) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={cmd.disabled}>
          {cmd.icon && <cmd.icon className="mr-2 size-4" />}
          {cmd.label}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {cmd.childIds.map(childId => (
            <CommandDropdownMenuItem key={childId} id={childId} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  // Radio — sub-menu with radio group
  if (cmd.kind === 'radio') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={cmd.disabled}>
          {cmd.icon && <cmd.icon className="mr-2 size-4" />}
          {cmd.label}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={cmd.value()}
            onValueChange={v => cmd.execute({ value: v })}
          >
            {cmd.options.map(opt => (
              <DropdownMenuRadioItem key={opt.id} value={opt.id}>
                {opt.icon && <opt.icon className="mr-2 size-4" />}
                {opt.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  // Toggle — checkbox item
  if (cmd.kind === 'toggle') {
    return (
      <DropdownMenuCheckboxItem
        checked={cmd.checked()}
        onSelect={() => cmd.execute()}
        disabled={cmd.disabled}
      >
        {cmd.label}
        {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
      </DropdownMenuCheckboxItem>
    )
  }

  // Default action
  return (
    <DropdownMenuItem
      onSelect={() => cmd.execute()}
      disabled={cmd.disabled}
      className={cmd.danger ? 'text-destructive focus:text-destructive' : ''}
    >
      {cmd.icon && <cmd.icon className="mr-2 size-4" />}
      {cmd.label}
      {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
    </DropdownMenuItem>
  )
}
```

**Usage:**

```tsx
<CommandDropdownMenu
  trigger={<Button variant="ghost" size="icon"><MoreHorizontal /></Button>}
  commands={[
    'task.open',
    'task.duplicate',
    '---',
    'task.priority',
    '---',
    'task.archive',
    'task.delete',
  ]}
/>
```

### Sequence hint

A floating indicator that shows available next steps when the user is mid-sequence.

```tsx
// components/sequence-hint.tsx
import { useShortcutState } from 'commandry/react'

export function SequenceHint() {
  const { buffer, pending } = useShortcutState()

  if (!buffer.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border bg-popover p-3 shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <p className="text-xs text-muted-foreground mb-2 font-mono">
        {buffer.map(combo => combo.join('+')).join(' → ')} → …
      </p>
      <div className="space-y-0.5">
        {pending.map(cmd => (
          <div key={cmd.id} className="flex items-center gap-3 text-sm">
            <kbd className="font-mono text-xs min-w-[2ch] text-muted-foreground">
              {formatNextStep(cmd.shortcut, buffer.length)}
            </kbd>
            <span>{cmd.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatNextStep(shortcut: string[][], completedSteps: number) {
  const next = shortcut[completedSteps]
  return next?.join('+').toUpperCase() ?? ''
}
```

### Toolbar

Renders commands as icon buttons with shortcut tooltips. Uses both `variant` and `danger` for styling — `variant` controls the button shape, `danger` controls the color.

```tsx
// components/command-toolbar.tsx
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useCommand, useShortcutDisplay } from 'commandry/react'
import { Separator } from '@/components/ui/separator'

type ToolbarEntry = string | '---'

export function CommandToolbar({ commands }: { commands: ToolbarEntry[] }) {
  return (
    <div className="flex items-center gap-1">
      {commands.map((entry, i) =>
        entry === '---' ? (
          <Separator key={i} orientation="vertical" className="h-6 mx-1" />
        ) : (
          <CommandToolbarButton key={entry} id={entry} />
        ),
      )}
    </div>
  )
}

function CommandToolbarButton({ id }: { id: string }) {
  const cmd = useCommand(id)
  const shortcut = useShortcutDisplay(cmd.shortcut)

  if (!cmd.visible || !cmd.icon) return null

  const isActive = cmd.kind === 'toggle' && cmd.checked?.()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? 'secondary' : cmd.variant ?? 'ghost'}
          size="icon"
          className={cmd.danger ? 'text-destructive border-destructive hover:bg-destructive/10' : ''}
          disabled={cmd.disabled || cmd.pending}
          onClick={() => cmd.execute()}
        >
          {cmd.pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <cmd.icon className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {cmd.label}
        {shortcut && (
          <kbd className="ml-2 font-mono text-xs opacity-60">{shortcut}</kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
```

**Usage:**

```tsx
<CommandToolbar
  commands={[
    'editor.bold',
    'editor.italic',
    'editor.underline',
    '---',
    'editor.alignLeft',
    'editor.alignCenter',
    'editor.alignRight',
  ]}
/>
```

---

## Shortcut adapter

Commandry ships with a built-in shortcut engine that handles single combos and key sequences. It covers most cases. If you need something different, you can swap it out or disable it entirely.

**Default — built-in engine, zero config:**

```tsx
<CommandryProvider registry={commandry.registry} />
```

**Bring your own:**

```tsx
import { tinykeysAdapter } from 'commandry/adapters/tinykeys'

<CommandryProvider
  registry={commandry.registry}
  shortcutAdapter={tinykeysAdapter()}
/>
```

**Disable shortcuts** — useful if you handle keybindings externally but still want the registry, scopes, and UI hooks:

```tsx
<CommandryProvider registry={commandry.registry} shortcuts={false} />
```

Then trigger commands manually:

```tsx
registry.execute('file.save')
```

**Custom adapter interface:**

```ts
type ShortcutAdapter = {
  bind: (
    shortcuts: ShortcutBinding[],
    execute: (commandId: string) => void | Promise<void>,
  ) => () => void // cleanup
}
```

---

## Collision detection

Commandry catches shortcut problems at runtime in development.

**Same-scope collision** — two commands bind the same shortcut in the same scope:

```
⚠️ [commandry] Shortcut collision: 'Enter' in scope 'task-item'
  → 'task.open' (features/tasks/commands.ts)
  → 'task.confirm' (features/tasks/more-commands.ts)
  Last registered wins. This is probably a bug.
```

**Parent-scope shadowing** — an inner scope overrides a shortcut from a parent scope:

```
⚠️ [commandry] Shortcut shadowing: 'Backspace'
  → 'task.delete' (scope: task-item)
  → 'tasks.clearFilter' (scope: task-list, parent)
  Inner scope takes priority. Add { shadow: true } if intentional.
```

Suppress intentional shadows:

```tsx
'task.delete': {
  shortcut: [['Backspace']],
  shadow: true,
  handler: ({ ctx }) => deleteTask(ctx.taskId),
}
```

**Prefix collision** — a single-step shortcut conflicts with the first step of a sequence:

```
⚠️ [commandry] Prefix collision in scope 'page':
  'g' is both a complete shortcut (nav.go) and
  the start of a sequence (nav.inbox: g → i)
  nav.go will never fire.
```

---

## Roadmap

The following are **planned** but not published yet. They extend the same “consistency” story as runtime collision warnings.

### ESLint plugin (`@commandry/eslint-plugin`)

Target rules (sketch):

```js
// eslint.config.js (future)
{
  plugins: ['@commandry'],
  rules: {
    '@commandry/label-casing': ['error', 'sentence'],
    '@commandry/label-verb-first': 'warn',
    '@commandry/label-max-length': ['warn', { max: 40 }],
    '@commandry/no-duplicate-labels': 'error',
    '@commandry/icon-map': ['error', { delete: 'Trash2', favorite: 'Star' /* … */ }],
    '@commandry/no-bare-alpha-shortcuts': 'error',
    '@commandry/no-prefix-collision': 'error',
    '@commandry/terminology': ['error', { 'log out': true, 'sign out': false }],
  },
}
```

### CLI audit (`commandry audit`)

Goal: scan the project and print a table of command ids, labels, icons, shortcuts, and scopes — similar to static analysis reports for duplicate labels and icon drift.

---

## Devtools

Render a small floating panel (active scope chain and registered command count):

```tsx
<CommandryProvider
  registry={registry}
  devtools={process.env.NODE_ENV === 'development'}
/>
```

`CommandryDevtools` is also exported from `commandry/react` if you want to mount it yourself.

---

## Package structure

```
commandry/
├── core/              # registry, types, context filtering, sequence engine
├── dom/               # resolveActiveContext, region attributes, ctx WeakMap
├── react/             # provider, hooks, CommandRegion, CommandryDevtools
├── adapters/
│   ├── tinykeys.ts
│   └── hotkeys-js.ts
└── index.ts

@commandry/eslint-plugin   # planned — label/icon/shortcut linting
```

---

## This repository (monorepo)

The workspace includes the `commandry` package (`packages/commandry`), a mail demo (`packages/demo`), and docs (`packages/docs`). From the repo root:

- `pnpm build` — build all packages
- `pnpm test` — Vitest for `commandry` core
- `pnpm test:e2e` — Playwright against the demo (install browsers once with `pnpm --filter demo test:e2e:install`)

See `[packages/demo/README.md](packages/demo/README.md)` for demo-specific E2E notes (`E2E_PORT`, `E2E_USE_DEV`).

---

## Releasing

`commandry` currently uses a manual release flow.

1. Validate the workspace from repo root:

   ```bash
   pnpm build
   pnpm lint
   pnpm test
   ```

2. Bump `packages/commandry/package.json` version.
3. Optionally verify the npm tarball:

   ```bash
   pnpm --filter commandry pack
   ```

4. Publish:

   ```bash
   pnpm --filter commandry publish --access public
   ```

`prepublishOnly` in `packages/commandry` enforces build + typecheck + tests before publish.

---

## License

MIT