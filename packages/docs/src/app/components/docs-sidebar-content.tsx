"use client";

import Link from "next/link";
import { Command } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";
import { docsNav } from "@/app/lib/docs-nav";
import { cn } from "@/app/lib/utils";

function isActiveHref(href: string, pathname: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function DocsNavLink({
  href,
  title,
  onNavigate,
}: {
  href: string;
  title: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActiveHref(href, pathname);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} onClick={onNavigate} />}
        isActive={active}
        size="sm"
        className={cn(
          "w-[calc(100%+0.75rem)] max-w-none px-2 -mx-1.5 font-[450] transition-[color,font-variation-settings,background-color] duration-150",
          /* No rail fill — override shadcn sidebar accent for hover/active */
          "bg-transparent hover:bg-transparent active:bg-transparent",
          "data-active:bg-transparent data-open:hover:bg-transparent",
          active
            ? "font-[550] text-black/80 data-active:text-black/80 [font-variation-settings:'wght'_550] dark:text-white/85 dark:data-active:text-white/85"
            : "text-muted-foreground hover:text-foreground/85 dark:hover:text-white/75"
        )}
      >
        {title}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DocsSidebarContent({
  onLinkClick,
  /** Mobile sheet: real logo here. Desktop: fixed `DocsSiteLogo` + spacer (except on `/`). */
  showInlineLogo = false,
}: {
  onLinkClick?: () => void;
  showInlineLogo?: boolean;
}) {
  const pathname = usePathname();
  const isOverview = pathname === "/";
  /** On homepage the floating mark sits over the hero — no empty header block in the rail. */
  const showDesktopHeaderSpacer = !isOverview && !showInlineLogo;

  return (
    <SidebarContent className="gap-2 overflow-visible px-0.5 pt-1">
      {showInlineLogo ? (
        <SidebarHeader className="mb-3 p-0">
          <Link
            href="/"
            onClick={onLinkClick}
            className="inline-flex outline-offset-4"
            aria-label="Commandry home"
          >
            <span
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-xl",
                "bg-[#404040] text-[#ececec]",
                "shadow-[inset_0_2.5px_0_0_rgba(255,255,255,0.22),inset_0_-2.5px_0_0_#000]",
                "dark:bg-[#4a4a4a] dark:text-[#f2f2f2]",
                "dark:shadow-[inset_0_2.5px_0_0_rgba(255,255,255,0.18),inset_0_-2.5px_0_0_#000]"
              )}
              aria-hidden
            >
              <Command
                className="size-[1.125rem] shrink-0 [filter:drop-shadow(0_-0.5px_1px_rgba(0,0,0,0.42))_drop-shadow(0_0.5px_1px_rgba(255,255,255,0.36))] dark:[filter:drop-shadow(0_-0.5px_1px_rgba(0,0,0,0.5))_drop-shadow(0_0.5px_1px_rgba(255,255,255,0.28))]"
                strokeWidth={2.25}
              />
            </span>
          </Link>
          <span className="sr-only">Commandry</span>
        </SidebarHeader>
      ) : showDesktopHeaderSpacer ? (
        <SidebarHeader className="mb-3 p-0" aria-hidden>
          <div className="h-10 w-10 shrink-0" />
        </SidebarHeader>
      ) : null}

      {docsNav.map((section) => {
        if (section.children) {
          return (
            <SidebarGroup key={section.title} className="mt-4 gap-2 p-0">
              <SidebarGroupLabel className="h-auto px-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
                {section.title}
              </SidebarGroupLabel>
              <SidebarMenu className="gap-0">
                {section.children.map((item) => (
                  <DocsNavLink
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    onNavigate={onLinkClick}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          );
        }

        if (section.href) {
          return (
            <SidebarGroup key={section.href} className="p-0">
              <SidebarMenu className="gap-0">
                <DocsNavLink
                  href={section.href}
                  title={section.title}
                  onNavigate={onLinkClick}
                />
              </SidebarMenu>
            </SidebarGroup>
          );
        }

        return null;
      })}
    </SidebarContent>
  );
}
