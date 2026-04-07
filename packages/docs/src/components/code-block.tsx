import type { ReactNode } from "react";

type CodeBlockProps = {
  children: ReactNode;
  title?: string;
  className?: string;
};

export function CodeBlock({ children, title, className = "" }: CodeBlockProps) {
  return (
    <div
      className={`my-5 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 ${className}`}
    >
      {title ? (
        <div className="border-b border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-500">
          {title}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-zinc-200">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}
