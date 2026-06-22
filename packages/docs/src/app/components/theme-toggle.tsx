"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { RiMoonLine, RiSunLine } from "@remixicon/react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

const toggleChrome =
  "border border-black/[0.06] bg-[#fdfdfc]/90 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0c0c0c]/90";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={!mounted}
      className={cn("size-9 shrink-0", toggleChrome)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={
        !mounted ? "Theme settings" : isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      title={
        !mounted ? undefined : isDark ? "Use light theme" : "Use dark theme"
      }
    >
      {!mounted ? (
        <RiMoonLine className="size-4 text-black/40 dark:text-white/40" aria-hidden />
      ) : isDark ? (
        <RiSunLine className="size-4 text-black/70 dark:text-white/80" />
      ) : (
        <RiMoonLine className="size-4 text-black/70 dark:text-white/80" />
      )}
    </Button>
  );
}
