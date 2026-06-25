import type { Metadata } from "next";
import Link from "next/link";
import { DocProse } from "@/app/lib/doc-prose";
import { CodeBlock } from "@/app/components/code-block";

export const metadata: Metadata = {
  title: "Shortcuts",
};

export default function ShortcutsPage() {
  return (
    <DocProse>
      <h1>Shortcuts</h1>
      <p>
        Shortcuts attach to commands and respect <Link href="/scopes">scope</Link>. Each shortcut is a
        sequence of key combos; most actions use a single step (e.g. <code>⌘S</code> is one combo). The
        runtime matches the deepest scope first; development builds warn on collisions and shadowing.
      </p>

      <h2>Encoding</h2>
      <CodeBlock>{`type Shortcut = KeyCombo[]     // array of steps
type KeyCombo = KeyToken[]     // keys pressed together in one step

type KeyToken =
  | 'mod'      // ⌘ on Mac, Ctrl on Windows/Linux
  | 'ctrl'     // always Ctrl
  | 'shift'
  | 'alt'      // Alt / Option
  | 'meta'     // always ⌘ / Windows key
  | string     // 'a', 'Enter', 'Backspace', 'ArrowUp', etc.`}</CodeBlock>

      <h2>Examples</h2>
      <CodeBlock>{`shortcut: [['mod', 's']]            // ⌘S / Ctrl+S
shortcut: [['mod', 'shift', 'p']]   // ⌘⇧P
shortcut: [['Backspace']]
shortcut: [['g'], ['i']]            // g then i (sequence)
shortcut: [['g'], ['mod', 'p']]     // g then ⌘P`}</CodeBlock>

      <h2>Sequence mode</h2>
      <p>
        When the user presses the first step of a multi-step shortcut, Commandry enters sequence
        mode and waits for the next step (default <strong>800ms</strong>, configurable). If no match,
        the buffer resets.
      </p>
      <CodeBlock>{`<CommandryProvider
  registry={registry}
  sequenceTimeout={800}
>
  {children}
</CommandryProvider>`}</CodeBlock>
      <p>
        Use <code>useShortcutState()</code> from <code>commandry/react</code> to build a sequence hint
        UI (buffer + pending commands). See <Link href="/hooks">Hooks API</Link> and{" "}
        <Link href="/recipes">Recipes</Link>.
      </p>

      <h2>Collision detection</h2>
      <p>
        In development, Commandry surfaces shortcut problems at runtime.
      </p>

      <h3>Same-scope collision</h3>
      <p>Two commands bind the same shortcut in the same scope—the last registered wins; this is usually a bug.</p>
      <CodeBlock title="Console (example)" language="log">{`⚠️ [commandry] Shortcut collision: 'Enter' in scope 'task-item'
  → 'task.open' (features/tasks/commands.ts)
  → 'task.confirm' (features/tasks/more-commands.ts)
  Last registered wins. This is probably a bug.`}</CodeBlock>

      <h3>Parent-scope shadowing</h3>
      <p>
        An inner scope overrides a parent&apos;s shortcut for the same key. Add{" "}
        <code>shadow: true</code> on the inner command if the override is intentional.
      </p>
      <CodeBlock title="Console (example)" language="log">{`⚠️ [commandry] Shortcut shadowing: 'Backspace'
  → 'task.delete' (scope: task-item)
  → 'tasks.clearFilter' (scope: task-list, parent)
  Inner scope takes priority. Add { shadow: true } if intentional.`}</CodeBlock>
      <CodeBlock>{`'task.delete': {
  shortcut: [['Backspace']],
  shadow: true,
  handler: ({ ctx }) => deleteTask(ctx.taskId),
}`}</CodeBlock>

      <h3>Prefix collision</h3>
      <p>
        A single-step shortcut conflicts with the first step of a sequence (e.g. <code>g</code> alone
        vs <code>g</code> then <code>i</code>). The complete single-step command may never fire.
      </p>
      <CodeBlock title="Console (example)" language="log">{`⚠️ [commandry] Prefix collision in scope 'page':
  'g' is both a complete shortcut (nav.go) and
  the start of a sequence (nav.inbox: g → i)
  nav.go will never fire.`}</CodeBlock>

      <h2>Shortcut adapters</h2>
      <p>
        Commandry ships with a built-in shortcut engine. You can swap in another adapter (e.g.{" "}
        tinykeys), disable global binding with <code>{'shortcuts={false}'}</code> on{" "}
        <code>CommandryProvider</code> while keeping the registry and hooks, or implement a custom{" "}
        <code>ShortcutAdapter</code>. Full options live on
        the <Link href="/adapters">Adapters</Link> page.
      </p>

      <p>
        Related: <Link href="/commands">Commands</Link> (<code>external</code>, multiple bindings),{" "}
        <Link href="/scopes">Scopes</Link>.
      </p>
    </DocProse>
  );
}
