import type { Metadata } from "next";
import Link from "next/link";
import { DocProse } from "@/app/lib/doc-prose";
import { CodeBlock } from "@/app/components/code-block";

export const metadata: Metadata = {
  title: "Regions",
};

export default function RegionsPage() {
  return (
    <DocProse>
      <h1>Regions</h1>
      <p>
        Regions describe <em>where</em> the user is working. Nesting <code>CommandRegion</code> in
        JSX <em>is</em> the hierarchy—parent/child comes from DOM ancestry, not a parallel config
        object. The runtime walks the DOM to resolve active regions, filter commands, and bind
        shortcuts.
      </p>

      <h2>Declare regions in JSX</h2>
      <p>
        You can mirror region names in a TypeScript union for documentation or strictness; the
        runtime does not require a config tree.
      </p>
      <CodeBlock>{`type Region = 'page' | 'task-list' | 'task-item'`}</CodeBlock>

      <h2>Active region chain</h2>
      <p>
        When the user&apos;s pointer enters a region, that region and its ancestors become active.
        Commands for any of those regions can apply; shortcuts resolve to the{" "}
        <strong>deepest</strong> matching region first.
      </p>
      <CodeBlock title="Example state" language="log">{`page (always active)
  └── task-list (pointer is here)
       └── task-item[id=3] (pointer is here — innermost)`}</CodeBlock>
      <p>
        In this state, commands scoped to <code>task-item</code>, <code>task-list</code>, and{" "}
        <code>page</code> are active. Commands scoped only to <code>canvas</code> are not. If both{" "}
        <code>task-item</code> and <code>task-list</code> bind <code>Backspace</code>, the{" "}
        <code>task-item</code> handler wins.
      </p>

      <h2>
        <code>CommandRegion</code>, <code>active</code>, and <code>hover</code>
      </h2>
      <p>
        Wrap UI regions with <code>CommandRegion</code> and pass <code>ctx</code> for handler data.
        Control participation in resolution:
      </p>
      <ul>
        <li>
          <code>hover</code> (default <code>true</code>) — pointer enters/leaves update active
          context; good for lists and canvases.
        </li>
        <li>
          <code>active</code> — region always participates while mounted (app shells, selected rows,
          split-pane reading panes).
        </li>
        <li>
          <code>hover={false}</code> — mount-only shell; pointer resolution skips this node.
        </li>
      </ul>
      <CodeBlock>{`<CommandRegion
  region="task-item"
  ctx={{ taskId: task.id, task }}
  anchor={{ taskId: task.id }}
>
  <TaskRow task={task} />
</CommandRegion>

{/* Selected row in a split pane */}
<CommandRegion region="task-item" ctx={{ taskId, task }} active hover={false}>
  <TaskDetail task={task} />
</CommandRegion>`}</CodeBlock>

      <h2>Nesting matches the DOM</h2>
      <p>
        Keep region nesting aligned with your component tree. Invalid nesting is not a compile-time
        error—region names are strings—but shortcuts and context menus only see what is in the DOM.
      </p>
      <CodeBlock>{`// Nested regions match DOM hierarchy
<CommandRegion region="page" ctx={{ pageId: '1' }}>
  <CommandRegion region="task-list" ctx={{ listId: 'abc' }}>
    ...
  </CommandRegion>
</CommandRegion>`}</CodeBlock>

      <h2>Context merging</h2>
      <p>
        Context merges along the active region chain. A handler in <code>task-item</code> receives
        keys from ancestor regions; TypeScript treats <code>ctx</code> as{" "}
        <code>{'Record<string, unknown>'}</code> unless you narrow.
      </p>
      <CodeBlock>{`// page:  { pageId }
// task-list: { listId }
// task-item: { taskId, task }

handler: ({ ctx }) => {
  ctx.pageId
  ctx.listId
  ctx.taskId
  ctx.task
}`}</CodeBlock>
      <p>
        <code>useRegisterCommands(commands, {`{ ctx }`})</code> can inject dependencies (stores, refs,
        clients) that are not part of the DOM hierarchy. When both <code>CommandRegion</code> and{" "}
        <code>useRegisterCommands</code> supply context, values merge; the region element wins on
        overlapping keys because it is more instance-specific.
      </p>
      <CodeBlock>{`useRegisterCommands(editorCommands, {
  ctx: { editor: editorInstance },
})`}</CodeBlock>

      <p>
        Related: <Link href="/commands">Commands</Link>,{" "}
        <Link href="/getting-started">Getting started</Link>,{" "}
        <Link href="/shortcuts">Shortcuts</Link>.
      </p>
    </DocProse>
  );
}
