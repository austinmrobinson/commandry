"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { RiMoonLine, RiSunLine } from "@remixicon/react";
import { Button } from "@/app/components/ui/button";
import { DOCS_FLOATING_CHROME } from "@/app/lib/docs-layout";
import { cn } from "@/app/lib/utils";

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
      className={cn("size-9 shrink-0", DOCS_FLOATING_CHROME)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={
        !mounted ? "Theme settings" : isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      title={
        !mounted ? undefined : isDark ? "Use light theme" : "Use dark theme"
      }
    >
      {!mounted ? (
        <RiMoonLine className="size-4 text-muted-foreground/70" aria-hidden />
      ) : isDark ? (
        <RiSunLine className="size-4 text-foreground/80" />
      ) : (
        <RiMoonLine className="size-4 text-foreground/80" />
      )}
    </Button>
  );
}
