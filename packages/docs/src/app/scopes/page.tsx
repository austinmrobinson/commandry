import type { Metadata } from "next";
import Link from "next/link";
import { DocProse } from "@/app/lib/doc-prose";
import { CodeBlock } from "@/app/components/code-block";

export const metadata: Metadata = {
  title: "Scopes",
};

export default function ScopesPage() {
  return (
    <DocProse>
      <h1>Scopes</h1>
      <p>
        Scopes describe <em>where</em> the user is working. You declare a nested{" "}
        <code>scopes</code> tree in <code>createCommandry</code>; the runtime uses the active scope
        path to filter commands and resolve shortcuts. Nesting in the config <em>is</em> the
        parent-child relationship.
      </p>

      <h2>Configure the tree</h2>
      <p>
        Pass <code>scopes</code> to <code>createCommandry</code>. You can mirror the same shape in a
        TypeScript type for documentation or helpers; the runtime does not infer literal scope types
        from the tree yet.
      </p>
      <CodeBlock>{`type Scopes = {
  page: {
    ctx: { pageId: string }
    children: {
      'task-list': {
        ctx: { listId: string }
        children: {
          'task-item': {
            ctx: { taskId: string; task: Task }
          }
        }
      }
    }
  }
}`}</CodeBlock>

      <h2>Active scope stack</h2>
      <p>
        When the user&apos;s pointer (or focus, depending on <code>activateOn</code>) enters a scope
        region, that scope and its ancestors are active. Commands for any of those scopes can apply;
        shortcuts resolve to the <strong>deepest</strong> matching scope first.
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
        <code>CommandScope</code> and <code>activateOn</code>
      </h2>
      <p>
        Wrap UI regions with <code>CommandScope</code> and pass <code>ctx</code> for handler data.
        Control how the scope becomes active:
      </p>
      <ul>
        <li>
          <code>pointer</code> (default) — follows hover; good for canvas-like surfaces.
        </li>
        <li>
          <code>focus</code> / <code>both</code> — better when keyboard navigation should drive scope
          without hover.
        </li>
        <li>
          <code>mount</code> — active whenever the subtree is mounted (e.g. app shells, split panes
          where pointer scoping is fragile).
        </li>
      </ul>
      <CodeBlock>{`<CommandScope
  scope="task-item"
  ctx={{ taskId: task.id, task }}
  activateOn="pointer"
>
  <TaskRow task={task} />
</CommandScope>`}</CodeBlock>

      <h2>Development warnings</h2>
      <p>
        With a configured scope tree, <strong>unknown</strong> scope names log a warning. Activating
        <strong> incompatible</strong> scopes at once (neither is an ancestor of the other in the
        tree) also warns. Invalid React nesting is not a compile-time error—keep scope strings aligned
        with <code>createCommandry({`{ scopes }`})</code> or model valid trees in TypeScript yourself.
      </p>
      <CodeBlock>{`// Matches tree: task-list under page
<CommandScope scope="page" ctx={{ pageId: '1' }}>
  <CommandScope scope="task-list" ctx={{ listId: 'abc' }}>
    ...
  </CommandScope>
</CommandScope>

// May warn if canvas-node is not under task-list in your configured tree
<CommandScope scope="task-list" ctx={{ listId: 'abc' }}>
  <CommandScope scope="canvas-node" ctx={{ nodeId: '1', node }}>
    ...
  </CommandScope>
</CommandScope>`}</CodeBlock>

      <h2>Context merging</h2>
      <p>
        Context merges along the active scope stack. A handler in <code>task-item</code> receives keys
        from ancestor scopes; TypeScript treats <code>ctx</code> as{" "}
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
        clients) that are not part of the DOM hierarchy. When both <code>CommandScope</code> and{" "}
        <code>useRegisterCommands</code> supply context, values merge; <code>CommandScope</code> wins
        on overlapping keys because it is more instance-specific.
      </p>
      <CodeBlock>{`useRegisterCommands(editorCommands, {
  ctx: { editor: editorInstance },
})`}</CodeBlock>

      <p>
        Related: <Link href="/commands">Commands</Link>, <Link href="/getting-started">Getting started</Link>,{" "}
        <Link href="/shortcuts">Shortcuts</Link>.
      </p>
    </DocProse>
  );
}
