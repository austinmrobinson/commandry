import type { Metadata } from "next";
import { DocProse } from "@/app/lib/doc-prose";

export const metadata: Metadata = {
  title: "Adapters",
};

export default function AdaptersPage() {
  return (
    <DocProse>
      <h1>Adapters</h1>
      <p>
        Keyboard adapters (e.g. tinykeys, hotkeys-js) connect global key handling to the
        Commandry registry. Choose one that fits your app or bring your own.
      </p>
      <p>Adapter-specific setup and tradeoffs will be documented here.</p>
    </DocProse>
  );
}
