"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/app/components/theme-provider";
import { TooltipProvider } from "@/app/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="commandry-docs-theme"
    >
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
