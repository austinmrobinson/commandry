"use client";

import * as React from "react";
import { RiMenuLine } from "@remixicon/react";
import { buttonVariants } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { DocsSidebarContent } from "@/app/components/docs-sidebar-content";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { cn } from "@/app/lib/utils";

/** Mobile nav + theme — fixed corner, no full-width header bar */
export function DocsFloatingControls() {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className={cn(
        "fixed right-4 z-50 flex items-center gap-2",
        "top-4 min-[980px]:top-6"
      )}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "min-[980px]:hidden",
            "border border-black/[0.06] bg-[#fdfdfc]/90 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0c0c0c]/90"
          )}
          aria-label="Open navigation menu"
        >
          <RiMenuLine className="size-5 text-black/50 dark:text-white/50" />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 border-black/[0.06] bg-[#fdfdfc] p-0 dark:border-white/10 dark:bg-[#0c0c0c]"
        >
          <DocsSidebarContent onLinkClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <ThemeToggle />
    </div>
  );
}
