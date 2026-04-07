import type { ReactNode } from "react";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";

type CalloutType = "info" | "warning" | "tip";

const styles: Record<
  CalloutType,
  { border: string; bg: string; icon: typeof Info; iconClass: string }
> = {
  info: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    icon: Info,
    iconClass: "text-blue-400",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    icon: AlertTriangle,
    iconClass: "text-amber-400",
  },
  tip: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    icon: Lightbulb,
    iconClass: "text-emerald-400",
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
      className={`my-5 flex gap-3 rounded-lg border px-4 py-3 ${s.border} ${s.bg}`}
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${s.iconClass}`} aria-hidden />
      <div className="min-w-0 text-sm leading-relaxed text-zinc-300">
        {title ? (
          <p className="mb-1 font-medium text-zinc-100">{title}</p>
        ) : null}
        <div className="space-y-2 [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-zinc-200">
          {children}
        </div>
      </div>
    </div>
  );
}
