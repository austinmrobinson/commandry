import type { Metadata } from "next";
import { DocProse } from "@/app/lib/doc-prose";

export const metadata: Metadata = {
  title: "Hooks API",
};

export default function HooksPage() {
  return (
    <DocProse>
      <h1>Hooks API</h1>
      <p>
        React hooks such as <code>useCommandry</code>, <code>useCommands</code>, and helpers
        for palette and context menu integration are exported from{" "}
        <code>commandry/react</code>.
      </p>
      <p>Per-hook reference will be expanded here.</p>
    </DocProse>
  );
}
