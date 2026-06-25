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
        Install <code>commandry</code>, create a registry with{" "}
        <code>createRegistry</code>, wrap your app with <code>CommandryProvider</code>, nest{" "}
        <code>CommandRegion</code> in your UI, and register commands with{" "}
        <code>useRegisterCommands</code>. React hooks and components live in{" "}
        <code>commandry/react</code>.
      </p>

      <h2>Install</h2>
      <InstallCommandBlock />

      <h2>1. Create the registry</h2>
      <p>
        <code>createRegistry()</code> returns a shared <strong>registry</strong>. Import React APIs
        from <code>commandry/react</code> (or re-export from a single{" "}
        <code>@/lib/commandry</code> module).
      </p>
      <CodeBlock title="lib/commandry.ts">{`import { createRegistry } from 'commandry'

export const registry = createRegistry()`}</CodeBlock>

      <h2>2. Define commands where they live</h2>
      <p>
        Colocate command maps with features. Each entry is id → definition—a plain object map of
        type <code>CommandDefinitionMap</code>.
      </p>
      <CodeBlock title="features/tasks/commands.ts">{`import type { CommandDefinitionMap } from 'commandry'
import { Plus, Trash2 } from 'lucide-react'

export const taskCommands: CommandDefinitionMap = {
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
}`}</CodeBlock>
      <p>
        There is no <code>scope</code> on these definitions—they inherit region from whichever{" "}
        <code>CommandRegion</code> wraps the component that calls{" "}
        <code>useRegisterCommands</code>. See{" "}
        <Link href="/commands">Commands</Link> and <Link href="/scopes">Regions</Link>.
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
        <code>CommandRegion</code> ancestor for region and merged context. Nesting regions in JSX{" "}
        <em>is</em> the hierarchy—no parallel config tree.
      </p>
      <CodeBlock title="features/tasks/task-list.tsx">{`import { CommandRegion, useRegisterCommands } from 'commandry/react'
import { taskCommands } from './commands'

function TaskList({ tasks, listId }: { tasks: Task[]; listId: string }) {
  return (
    <CommandRegion region="task-list" ctx={{ listId }}>
      {tasks.map((task) => (
        <CommandRegion
          key={task.id}
          region="task-item"
          ctx={{ taskId: task.id, task }}
        >
          <TaskItem task={task} />
        </CommandRegion>
      ))}
    </CommandRegion>
  )
}

function TaskItem({ task }: { task: Task }) {
  useRegisterCommands(taskCommands) // inherits region 'task-item' from parent

  return <TaskRow task={task} />
}`}</CodeBlock>

      <h2>Stable command maps</h2>
      <p>
        <code>useRegisterCommands</code> depends on the <strong>commands object reference</strong>.
        Passing a new inline object every render will unregister and re-register repeatedly. Prefer a
        module-level map, or memoize:
      </p>
      <CodeBlock>{`const commands = useMemo(
  (): CommandDefinitionMap => ({
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
          <Link href="/scopes">Regions</Link> — <code>active</code>, <code>hover</code>, context merging
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
        regions before the palette reads them. Call{" "}
        <code>registry.pinContext(resolveActiveContext())</code> synchronously when opening the dialog,
        then use <code>registry.getContextPin()</code> when filtering search until{" "}
        <code>registry.clearContextPin()</code>. Alternatively use{" "}
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
          <code>active</code> and <code>hover</code>:
        </strong>{" "}
        By default regions follow pointer hover. Set <code>active</code> so a region participates
        without hover (selected row, reading pane). Set <code>hover={false}</code> for mount-only shells.
        Details on <Link href="/scopes">Regions</Link>.
      </p>
    </DocProse>
  );
}
