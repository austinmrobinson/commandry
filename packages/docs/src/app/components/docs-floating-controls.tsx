"use client";

import * as React from "react";
import { RiMenuLine } from "@remixicon/react";
import { buttonVariants } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { DocsSidebarContent } from "@/app/components/docs-sidebar-content";
import { DOCS_FLOATING_CHROME } from "@/app/lib/docs-layout";
import { cn } from "@/app/lib/utils";

/** Mobile nav — fixed corner; desktop uses margin rail (no floating chrome). */
export function DocsFloatingControls() {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex items-center gap-2 min-[980px]:hidden"
      )}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "min-[980px]:hidden",
            DOCS_FLOATING_CHROME
          )}
          aria-label="Open navigation menu"
        >
          <RiMenuLine className="size-5 text-muted-foreground" />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 border-border bg-background p-0"
        >
          <DocsSidebarContent
            showInlineLogo
            onLinkClick={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
