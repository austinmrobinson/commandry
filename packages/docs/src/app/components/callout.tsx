import type { ReactNode } from "react";
import { RiAlertLine, RiInformationLine, RiLightbulbLine } from "@remixicon/react";
import { cn } from "@/app/lib/utils";

type CalloutType = "info" | "warning" | "tip";

const styles: Record<
  CalloutType,
  { border: string; bg: string; icon: typeof RiInformationLine; iconClass: string }
> = {
  info: {
    border: "border-primary/25",
    bg: "bg-primary/5",
    icon: RiInformationLine,
    iconClass: "text-primary",
  },
  warning: {
    border: "border-destructive/30",
    bg: "bg-destructive/10",
    icon: RiAlertLine,
    iconClass: "text-destructive",
  },
  tip: {
    border: "border-success/30",
    bg: "bg-success/10",
    icon: RiLightbulbLine,
    iconClass: "text-success",
  },
};

type CalloutProps = {
  type: CalloutType;
  title?: string;
  children: ReactNode;
};

export function Callout({ type, title, children }: CalloutProps) {
  const s = styles[type];
  const Icon = s.icon;

  return (
    <div
      className={cn(
        "my-5 flex gap-3 rounded-lg border px-4 py-3",
        s.border,
        s.bg
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", s.iconClass)} aria-hidden />
      <div className="min-w-0 text-base leading-relaxed text-foreground">
        {title ? <p className="mb-1 font-medium text-foreground">{title}</p> : null}
        <div className="space-y-2 text-muted-foreground [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-base [&_code]:text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
