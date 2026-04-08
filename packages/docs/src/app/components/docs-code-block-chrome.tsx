"use client";

import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { buttonVariants } from "@/app/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  type PackageManagerId,
  usePackageManager,
  useSetPackageManager,
} from "@/app/hooks/use-docs-code-prefs";
import { cn } from "@/app/lib/utils";

const BODY_PRE_CLASS =
  "overflow-x-auto px-4 py-3.5 [&_pre.shiki]:m-0 [&_pre.shiki]:max-w-none [&_pre.shiki]:bg-transparent [&_pre.shiki]:p-0 [&_pre.shiki]:font-mono [&_pre.shiki]:text-sm [&_pre.shiki]:leading-normal";

const SHELL_CLASS =
  "group/docs-code relative docs-code-block my-2.5 overflow-hidden rounded-lg border border-border bg-muted/45 text-foreground";

const HEADER_ROW_CLASS =
  "flex min-h-10 items-center justify-between gap-1.5 border-b border-border py-2 pl-4 pr-2";

async function copyText(text: string) {
  if (!text || typeof window === "undefined") return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyToolbarButton({
  textToCopy,
  onCopiedChange,
}: {
  textToCopy: string;
  onCopiedChange?: (copied: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => {
      setCopied(false);
      onCopiedChange?.(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [copied, onCopiedChange]);

  const handleCopy = useCallback(async () => {
    const ok = await copyText(textToCopy);
    if (ok) {
      setCopied(true);
      onCopiedChange?.(true);
    }
  }, [textToCopy, onCopiedChange]);

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        onClick={() => void handleCopy()}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "size-8 shrink-0 p-0 text-muted-foreground hover:text-foreground",
        )}
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? (
          <RiCheckLine className="size-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <RiFileCopyLine className="size-4" />
        )}
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        {copied ? "Copied" : "Copy"}
      </TooltipContent>
    </Tooltip>
  );
}

function CopyToolbarSlot({
  textToCopy,
}: {
  textToCopy: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className={cn(
        "shrink-0 transition-opacity duration-150",
        "opacity-0 group-hover/docs-code:opacity-100 group-focus-within/docs-code:opacity-100",
        copied && "opacity-100",
      )}
    >
      <CopyToolbarButton textToCopy={textToCopy} onCopiedChange={setCopied} />
    </div>
  );
}

export type DocsCodeBlockChromeSingleProps = {
  variant: "single";
  raw: string;
  html: string;
  title?: string;
  className?: string;
};

export type DocsCodeBlockChromePackageManagerProps = {
  variant: "package-manager";
  rawByPm: Record<PackageManagerId, string>;
  htmlByPm: Record<PackageManagerId, string>;
  className?: string;
};

export type DocsCodeBlockChromeProps =
  | DocsCodeBlockChromeSingleProps
  | DocsCodeBlockChromePackageManagerProps;

const PM_ORDER: PackageManagerId[] = ["pnpm", "npm", "yarn"];

export function DocsCodeBlockChrome(props: DocsCodeBlockChromeProps) {
  if (props.variant === "single") {
    return (
      <div className={cn(SHELL_CLASS, props.className)}>
        <div className={HEADER_ROW_CLASS}>
          {props.title ? (
            <span className="min-w-0 truncate text-sm font-medium text-muted-foreground">
              {props.title}
            </span>
          ) : (
            <span />
          )}
          <CopyToolbarSlot textToCopy={props.raw} />
        </div>
        <div
          className={BODY_PRE_CLASS}
          dangerouslySetInnerHTML={{ __html: props.html }}
        />
      </div>
    );
  }

  return (
    <DocsCodeBlockChromePackageManager
      rawByPm={props.rawByPm}
      htmlByPm={props.htmlByPm}
      className={props.className}
    />
  );
}

function DocsCodeBlockChromePackageManager({
  rawByPm,
  htmlByPm,
  className,
}: Omit<DocsCodeBlockChromePackageManagerProps, "variant">) {
  const pm = usePackageManager();
  const setPm = useSetPackageManager();

  const raw = rawByPm[pm];
  const html = htmlByPm[pm];

  return (
    <div className={cn(SHELL_CLASS, className)}>
      <div className={cn(HEADER_ROW_CLASS, "flex-wrap")}>
        <div
          className="-ml-2 flex min-w-0 flex-wrap items-center gap-1"
          role="tablist"
          aria-label="Package manager"
        >
          {PM_ORDER.map((id) => {
            const active = pm === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPm(id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {id}
              </button>
            );
          })}
        </div>
        <CopyToolbarSlot textToCopy={raw} />
      </div>
      <div
        className={BODY_PRE_CLASS}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
