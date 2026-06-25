import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/app/components/ui/button";
import { CodeBlock } from "@/app/components/code-block";
import { DocProse } from "@/app/lib/doc-prose";
import { cn } from "@/app/lib/utils";

export const metadata: Metadata = {
  title: "Overview",
};

export default function OverviewPage() {
  return (
    <DocProse>
      <h1>Commandry</h1>
      <p className="text-pretty">
        One registry for every surface in your React app — command palettes, context menus,
        toolbars, and keyboard shortcuts stay consistent because they read from the same
        definitions.
      </p>

      <p className="text-pretty">
        Most apps scatter actions across files: a shortcut here, a menu label there. Labels
        drift, shortcuts collide, and adding a feature means touching several components.
        Commandry keeps each action&apos;s label, icon, shortcut, scope, and handler in one
        place, then lets you surface it anywhere.
      </p>

      <div className="not-prose mt-4 flex flex-wrap gap-3">
        <Link
          href="/getting-started"
          className={cn(buttonVariants({ variant: "default" }), "no-underline")}
        >
          Install
        </Link>
      </div>

      <h2>How it works</h2>

      <div className="not-prose mt-2 flex flex-col gap-14 sm:gap-16">
        <section>
          <h3 className="mb-2 text-balance text-sm font-medium text-muted-foreground">
            1. Create the registry
          </h3>
          <p className="mb-2 text-pretty">
            One shared registry for every surface in the app.
          </p>
          <CodeBlock title="lib/commandry.ts">{`import { createRegistry } from 'commandry'

export const registry = createRegistry()`}</CodeBlock>
        </section>

        <section>
          <h3 className="mb-2 text-balance text-sm font-medium text-muted-foreground">
            2. Register commands
          </h3>
          <p className="mb-2 text-pretty">
            Colocate commands with features; region comes from the nearest{" "}
            <code className="rounded bg-overlay-subtle px-1 py-0.5 font-mono text-[0.9375rem] text-foreground">
              CommandRegion
            </code>
            .
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
    handler: ({ ctx }) => deleteTask(ctx.taskId),
  },
}`}</CodeBlock>
        </section>

        <section>
          <h3 className="mb-2 text-balance text-sm font-medium text-muted-foreground">
            3. Provider &amp; regions
          </h3>
          <p className="mb-2 text-pretty">
            Wrap the app with the provider, then nest{" "}
            <code className="rounded bg-overlay-subtle px-1 py-0.5 font-mono text-[0.9375rem] text-foreground">
              CommandRegion
            </code>{" "}
            and{" "}
            <code className="rounded bg-overlay-subtle px-1 py-0.5 font-mono text-[0.9375rem] text-foreground">
              useRegisterCommands
            </code>{" "}
            where commands should apply.
          </p>
          <CodeBlock title="app/layout.tsx & feature">{`import { CommandryProvider, CommandRegion, useRegisterCommands } from 'commandry/react'
import { registry } from '@/lib/commandry'
import { taskCommands } from '@/features/tasks/commands'

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommandryProvider registry={registry}>{children}</CommandryProvider>
  )
}

function TaskList({ listId }: { listId: string }) {
  return (
    <CommandRegion region="task-list" ctx={{ listId }}>
      {tasks.map((task) => (
        <CommandRegion key={task.id} region="task-item" ctx={{ taskId: task.id, task }}>
          <TaskItem task={task} />
        </CommandRegion>
      ))}
    </CommandRegion>
  )
}

function TaskItem({ task }: { task: Task }) {
  useRegisterCommands(taskCommands)
  return <TaskRow task={task} />
}`}</CodeBlock>
        </section>

        <section>
          <h3 className="mb-2 text-balance text-sm font-medium text-muted-foreground">
            4. Render surfaces
          </h3>
          <p className="mb-2 text-pretty">
            Read the same registry in a toolbar, cmdk palette, or context menu — here, listing resolved commands for the active region.
          </p>
          <CodeBlock title="components/quick-toolbar.tsx">{`'use client'

import { useCommands } from 'commandry/react'

export function QuickToolbar() {
  const commands = useCommands()

  return (
    <div className="flex gap-2">
      {commands.map((cmd) => (
        <button
          key={cmd.id}
          type="button"
          disabled={cmd.disabled}
          onClick={() => void cmd.execute()}
        >
          {cmd.label}
        </button>
      ))}
    </div>
  )
}`}</CodeBlock>
          <p className="mt-2 text-pretty text-text-tertiary">
            For search + cmdk, use{" "}
            <code className="rounded bg-overlay-subtle px-1 py-0.5 font-mono text-[0.9375rem] text-foreground">
              useCommandSearch
            </code>{" "}
            and wire results into your palette component — see the repo demo app.
          </p>
        </section>
      </div>
    </DocProse>
  );
}
