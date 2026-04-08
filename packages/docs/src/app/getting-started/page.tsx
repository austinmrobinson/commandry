import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/app/components/code-block";
import { InstallCommandBlock } from "@/app/components/install-command-block";
import { DocProse } from "@/app/lib/doc-prose";

export const metadata: Metadata = {
  title: "Getting Started",
};

export default async function GettingStartedPage() {
  return (
    <DocProse>
      <h1>Getting started</h1>
      <p>
        Install <code>commandry</code>, configure a scope tree with{" "}
        <code>createCommandry</code>, wrap your app with <code>CommandryProvider</code>, and
        register commands with <code>defineCommands</code> and{" "}
        <code>useRegisterCommands</code>. React hooks and components live in{" "}
        <code>commandry/react</code>.
      </p>

      <h2>Install</h2>
      <InstallCommandBlock />

      <h2>1. Configure scopes and registry</h2>
      <p>
        Scopes define <em>where</em> commands are active. Pass a nested{" "}
        <code>scopes</code> object to <code>createCommandry</code> that mirrors your UI hierarchy.{" "}
        Nesting <em>is</em> the parent-child relationship—no separate declaration.
      </p>
      <p>
        <code>createCommandry</code> returns the <strong>registry</strong> and a{" "}
        <code>defineCommands</code> helper. Import React APIs from <code>commandry/react</code>{" "}
        (or re-export from a single <code>@/lib/commandry</code> module).
      </p>
      <CodeBlock title="lib/commandry.ts">{`import { createCommandry } from 'commandry'

/** Optional: mirror \`scopes\` in a type for documentation and app-level helpers. */
type _ScopeNames =
  | 'page'
  | 'task-list'
  | 'task-item'
  | 'canvas'
  | 'canvas-node'

export const { registry, defineCommands } = createCommandry({
  scopes: {
    page: {
      children: {
        'task-list': {
          children: {
            'task-item': {},
          },
        },
        canvas: {
          children: {
            'canvas-node': {},
          },
        },
      },
    },
  },
})`}</CodeBlock>

      <h2>2. Define commands where they live</h2>
      <p>
        Colocate command maps with features. Use <code>defineCommands</code> for a typed map of
        id → definition.
      </p>
      <CodeBlock title="features/tasks/commands.ts">{`import { defineCommands } from '@/lib/commandry'
import { Plus, Trash2 } from 'lucide-react'

export const taskCommands = defineCommands({
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
})`}</CodeBlock>
      <p>
        There is no <code>scope</code> on these definitions—they inherit scope from whichever{" "}
        <code>CommandScope</code> wraps the component that calls{" "}
        <code>useRegisterCommands</code>. See{" "}
        <Link href="/commands">Commands</Link> and <Link href="/scopes">Scopes</Link>.
      </p>

      <h2>3. Wire up the provider</h2>
      <CodeBlock title="app/layout.tsx">{`import { CommandryProvider } from 'commandry/react'
import { registry } from '@/lib/commandry'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CommandryProvider registry={registry}>
      {children}
    </CommandryProvider>
  )
}`}</CodeBlock>

      <h2>4. Register commands from components</h2>
      <p>
        Commands register on mount and unregister on unmount. They use the nearest{" "}
        <code>CommandScope</code> ancestor for scope and merged context.
      </p>
      <CodeBlock title="features/tasks/task-list.tsx">{`import { CommandScope, useRegisterCommands } from 'commandry/react'
import { taskCommands } from './commands'

function TaskList({ tasks, listId }: { tasks: Task[]; listId: string }) {
  return (
    <CommandScope scope="task-list" ctx={{ listId }}>
      {tasks.map((task) => (
        <CommandScope
          key={task.id}
          scope="task-item"
          ctx={{ taskId: task.id, task }}
        >
          <TaskItem task={task} />
        </CommandScope>
      ))}
    </CommandScope>
  )
}

function TaskItem({ task }: { task: Task }) {
  useRegisterCommands(taskCommands) // inherits scope 'task-item' from parent

  return <TaskRow task={task} />
}`}</CodeBlock>

      <h2>Stable command maps</h2>
      <p>
        <code>useRegisterCommands</code> depends on the <strong>commands object reference</strong>.
        Passing a new inline object every render will unregister and re-register repeatedly. Prefer a
        module-level <code>defineCommands({`{ ... }`})</code> map, or memoize:
      </p>
      <CodeBlock>{`const commands = useMemo(
  () =>
    defineCommands({
      'item.rename': { label: 'Rename', handler: () => rename(id) },
    }),
  [id, rename],
)
useRegisterCommands(commands)`}</CodeBlock>
      <p>
        For per-row or dynamic ids (e.g. <code>thread.{`{id}`}.archive</code>), build the map inside
        the row and keep the pattern stable—see the <Link href="/commands">Commands</Link> page.
      </p>

      <h2>Next steps</h2>
      <ul>
        <li>
          <Link href="/commands">Commands</Link> — fields, visibility, kinds, async handlers
        </li>
        <li>
          <Link href="/scopes">Scopes</Link> — <code>activateOn</code>, context merging, dev warnings
        </li>
        <li>
          <Link href="/shortcuts">Shortcuts</Link> — chords, sequences, collisions
        </li>
        <li>
          <Link href="/recipes">Recipes</Link> — palette, menus, toolbars
        </li>
      </ul>

      <h2>Advanced (optional)</h2>
      <p>
        <strong>Command palette and focus:</strong> opening cmdk can move focus and clear pointer-based
        scopes before the palette reads them. Call{" "}
        <code>registry.pinActiveScopeSnapshot()</code> synchronously when opening the dialog, then use{" "}
        <code>registry.getActiveScopeSnapshotPin()</code> when filtering search until{" "}
        <code>registry.clearActiveScopeSnapshotPin()</code>. Alternatively use{" "}
        <code>useCommandPalettePin(open)</code> from <code>commandry/react</code> when you cannot pin
        in the event path.
      </p>
      <p>
        <strong>Bulk selection:</strong> mark commands with <code>bulkAction: true</code>, set{" "}
        <code>preferBulkShortcuts</code> on <code>CommandryProvider</code>, and optionally{" "}
        <code>shortcutBindingFilterWhileBulk</code> from <code>commandry</code> to prefer bulk actions
        while multiple items are selected.
      </p>
      <p>
        <strong>
          <code>activateOn</code>:
        </strong>{" "}
        <code>pointer</code> (default) follows hover; <code>focus</code> / <code>both</code> suit
        keyboard-driven lists; <code>mount</code> keeps the scope active whenever the subtree is
        mounted (e.g. split panes). Details on <Link href="/scopes">Scopes</Link>.
      </p>
    </DocProse>
  );
}
