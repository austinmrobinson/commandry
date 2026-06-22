import type { Metadata } from "next";
import Link from "next/link";
import { DocProse } from "@/app/lib/doc-prose";
import { CodeBlock } from "@/app/components/code-block";

export const metadata: Metadata = {
  title: "Commands",
};

export default function CommandsPage() {
  return (
    <DocProse>
      <h1>Commands</h1>
      <p>
        A command is a single user-facing action: a unique id, a <code>label</code>, and a{" "}
        <code>handler</code>. Everything else—icon, shortcut, scope, grouping, and behavior flags—is
        optional. Commands are plain objects registered with <code>defineCommands</code> and resolved
        through the shared registry.
      </p>

      <h2>Command shape</h2>
      <p>
        At minimum you provide display fields and a handler. Optional fields control shortcuts,
        scoping, visibility, and styling.
      </p>
      <CodeBlock>{`type Command = {
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
  scope?: ScopeKey                    // omit to inherit from nearest CommandScope
  when?: () => boolean                // false = hidden entirely
  enabled?: () => boolean             // false = visible but grayed out

  // Advanced
  shadow?: boolean                    // suppress shortcut shadowing warnings
  external?: boolean                  // shortcut handled elsewhere, skip binding
}`}</CodeBlock>

      <h2>
        <code>danger</code> and <code>variant</code>
      </h2>
      <p>
        These are independent. <code>danger</code> is semantic—the action is destructive or
        irreversible. <code>variant</code> is a visual hint for button-like surfaces (toolbars).
        Menus and the palette use <code>danger</code> for color; only button-like UIs use{" "}
        <code>variant</code>.
      </p>
      <CodeBlock>{`'task.delete': {
  label: 'Delete Task',
  icon: Trash2,
  danger: true,
  variant: 'outline',
  handler: ({ ctx }) => deleteTask(ctx.taskId),
}

'task.save': {
  label: 'Save Changes',
  icon: Save,
  variant: 'default',
  handler: () => save(),
}`}</CodeBlock>

      <h2>
        <code>when</code> vs <code>enabled</code>
      </h2>
      <p>
        <code>when</code> controls <strong>visibility</strong>. If it returns <code>false</code>, the
        command disappears from menus, palettes, and toolbars; the shortcut is unbound.
      </p>
      <p>
        <code>enabled</code> controls <strong>interactivity</strong>. If it returns{" "}
        <code>false</code>, the command stays visible but is grayed out; the shortcut is suppressed.
      </p>
      <CodeBlock>{`'file.save': {
  label: 'Save',
  icon: Save,
  shortcut: [['mod', 's']],
  when: () => isEditor,
  enabled: () => hasUnsavedChanges,
  handler: () => save(),
}

// Resolved command (e.g. from useCommand):
// cmd.visible  — false if when() is false
// cmd.disabled — true if enabled() is false`}</CodeBlock>

      <h2>Scope inference</h2>
      <p>
        Commands inherit scope from the nearest <code>CommandScope</code> ancestor where{" "}
        <code>useRegisterCommands</code> runs. An explicit <code>scope</code> on the definition always
        wins. See <Link href="/scopes">Scopes</Link>.
      </p>
      <CodeBlock>{`const taskItemCommands = defineCommands({
  'task.open':   { label: 'Open Task',   handler: ({ ctx }) => open(ctx.taskId) },
  'task.delete': { label: 'Delete Task', handler: ({ ctx }) => del(ctx.taskId) },
})

// Registered inside task-item — inherits that scope
'tasks.create': {
  label: 'New Task',
  scope: 'task-list',  // explicit override
  handler: () => createTask(),
}`}</CodeBlock>

      <h2>Unscoped (global) commands</h2>
      <p>
        Commands with no <code>scope</code>, registered outside any <code>CommandScope</code>, are{" "}
        <strong>global</strong>: always active and always available in the palette regardless of
        pointer or focus.
      </p>
      <CodeBlock>{`'app.settings': {
  label: 'Settings',
  icon: Settings,
  shortcut: [['mod', ',']],
  handler: () => openSettings(),
}`}</CodeBlock>

      <h2>Multiple shortcuts</h2>
      <p>
        Pass an array of shortcut bindings for platform variants or legacy keys.{" "}
        <code>useShortcutDisplay</code> uses the <strong>first</strong> binding for menus and
        tooltips by default; all bindings stay active.
      </p>
      <CodeBlock>{`'editor.copy': {
  label: 'Copy',
  icon: Copy,
  shortcut: [
    [['mod', 'c']],
    [['ctrl', 'Insert']],
  ],
  scope: 'editor',
  handler: ({ ctx }) => copy(ctx.selection),
}

useShortcutDisplay(cmd.shortcut)        // first binding
useShortcutDisplay(cmd.shortcut, 1)        // second
useShortcutDisplay(cmd.shortcut, 'all')    // all, joined`}</CodeBlock>

      <h2>
        <code>description</code> and <code>priority</code>
      </h2>
      <p>
        <code>description</code> is a subtitle in the palette. <code>priority</code> sorts within a
        group (higher first; default <code>0</code>).
      </p>

      <h2>
        <code>external</code>
      </h2>
      <p>
        Use <code>external: true</code> when the shortcut is handled elsewhere (cmdk, editor, etc.).
        The command still appears in the palette with its shortcut shown; Commandry does not bind a
        listener for that key.
      </p>
      <CodeBlock>{`'app.commandPalette': {
  label: 'Command Palette',
  shortcut: [['mod', 'k']],
  external: true,
  handler: () => {},
}`}</CodeBlock>

      <h2>Command kinds</h2>
      <p>
        Beyond simple actions, you can use <strong>toggle</strong>, <strong>radio</strong>, and{" "}
        <strong>parent</strong> (nested children) for richer UIs—menus and cmdk pages consume these
        the same way.
      </p>
      <h3>Toggle</h3>
      <CodeBlock>{`'view.sidebar': {
  label: ({ ctx }) => ctx.sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar',
  icon: ({ ctx }) => ctx.sidebarOpen ? PanelLeftClose : PanelLeft,
  shortcut: [['mod', 'b']],
  scope: 'page',
  kind: 'toggle',
  checked: ({ ctx }) => ctx.sidebarOpen,
  handler: () => toggleSidebar(),
}`}</CodeBlock>
      <h3>Radio</h3>
      <CodeBlock>{`'view.theme': {
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
}`}</CodeBlock>
      <h3>Parent (children)</h3>
      <CodeBlock>{`'editor.turnInto': {
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
  },
}`}</CodeBlock>

      <h2>Async handlers</h2>
      <p>
        Handlers may return a <code>Promise</code>. While it is unresolved, the resolved command{" "}
        exposes <code>pending</code>; the shortcut is suppressed and <code>execute()</code> does not
        double-fire.
      </p>
      <CodeBlock>{`'data.export': {
  label: 'Export Data',
  icon: Download,
  handler: async ({ ctx }) => {
    const blob = await generateExport(ctx.projectId)
    downloadBlob(blob)
  },
}

// const cmd = useCommand('data.export')
// cmd.pending — true while async handler runs`}</CodeBlock>

      <h2>Custom properties</h2>
      <p>
        Definitions and resolved commands support extra keys via index signatures—use for roles,
        analytics ids, layout hints, or feature flags. Narrow in your app code as needed.
      </p>
      <CodeBlock>{`'admin.resetData': {
  label: 'Reset All Data',
  icon: AlertTriangle,
  danger: true,
  requiredRole: 'admin' as const,
  analytics: 'admin_reset_data',
  handler: () => resetData(),
}`}</CodeBlock>

      <p>
        Related: <Link href="/shortcuts">Shortcuts</Link>, <Link href="/scopes">Scopes</Link>,{" "}
        <Link href="/recipes">Recipes</Link>.
      </p>
    </DocProse>
  );
}
