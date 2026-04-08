"use client";

import Link from "next/link";
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
          active
            ? "font-[550] text-black/80 [font-variation-settings:'wght'_550] dark:text-white/85"
            : "text-muted-foreground"
        )}
      >
        {title}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DocsSidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <SidebarContent className="gap-2 overflow-visible px-0.5 pt-1">
      <SidebarHeader className="mb-3 p-0">
        <span
          className="inline-block size-12 bg-[#111] dark:bg-[#e8e8e8]"
          aria-hidden
        />
        <span className="sr-only">Commandry</span>
      </SidebarHeader>

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
