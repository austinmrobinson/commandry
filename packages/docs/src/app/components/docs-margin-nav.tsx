"use client";

import Link from "next/link";
import { Command } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { flattenDocsNav, type NavItem } from "@/app/lib/docs-nav";
import { cn } from "@/app/lib/utils";

const LEAVE_DELAY_MS = 120;
const ROW_GAP_PX = 7;
const COLLAPSED_ROW_PX = 2;
const EXPANDED_ROW_PX = 22;
const COLLAPSED_WIDTH_PX = 40;
const EXPANDED_WIDTH_PX = 176;
const COLLAPSED_RADIUS_PX = 8;
const EXPANDED_RADIUS_PX = 12;

const panelTransition = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
  mass: 0.85,
};

const crossfadeTransition = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

function isActiveHref(href: string, pathname: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function collapsedBarWidth(title: string) {
  return `${Math.min(100, 36 + title.length * 5)}%`;
}

function panelMetrics(itemCount: number, expanded: boolean) {
  const rowHeight = expanded ? EXPANDED_ROW_PX : COLLAPSED_ROW_PX;
  const gaps = Math.max(0, itemCount - 1) * ROW_GAP_PX;
  const paddingTop = expanded ? 12 : 10;
  const paddingBottom = expanded ? 12 : 10;
  const paddingX = expanded ? 12 : 8;

  return {
    height: itemCount * rowHeight + gaps + paddingTop + paddingBottom,
    width: expanded ? EXPANDED_WIDTH_PX : COLLAPSED_WIDTH_PX,
    borderRadius: expanded ? EXPANDED_RADIUS_PX : COLLAPSED_RADIUS_PX,
    paddingTop,
    paddingBottom,
    paddingX,
  };
}

function NavItemRow({
  item,
  pathname,
  expanded,
  reduceMotion,
}: {
  item: NavItem;
  pathname: string;
  expanded: boolean;
  reduceMotion: boolean | null;
}) {
  const active = isActiveHref(item.href, pathname);
  const barOpacity = active ? 0.75 : 0.25;
  const rowTransition = reduceMotion ? { duration: 0 } : panelTransition;

  return (
    <motion.div
      initial={false}
      animate={{ height: expanded ? EXPANDED_ROW_PX : COLLAPSED_ROW_PX }}
      transition={rowTransition}
      className="relative w-full overflow-hidden"
    >
      <motion.span
        aria-hidden={expanded}
        className="absolute left-0.5 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-foreground"
        style={{ width: collapsedBarWidth(item.title) }}
        initial={false}
        animate={{ opacity: expanded ? 0 : barOpacity }}
        transition={crossfadeTransition}
      />

      <motion.span
        className="absolute inset-x-0 top-1/2 w-full -translate-y-1/2 truncate"
        style={{ pointerEvents: expanded ? "auto" : "none" }}
        initial={false}
        animate={{
          opacity: expanded ? 1 : 0,
          filter: reduceMotion
            ? "blur(0px)"
            : expanded
              ? "blur(0px)"
              : "blur(6px)",
        }}
        transition={crossfadeTransition}
      >
        <Link
          href={item.href}
          tabIndex={expanded ? 0 : -1}
          className={cn(
            "block truncate px-0.5 text-sm font-[450] leading-none no-underline transition-colors duration-150",
            active
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.title}
        </Link>
      </motion.span>
    </motion.div>
  );
}

function MarginNavPanel({
  pathname,
  expanded,
  reduceMotion,
}: {
  pathname: string;
  expanded: boolean;
  reduceMotion: boolean | null;
}) {
  const items = flattenDocsNav();
  const metrics = useMemo(
    () => panelMetrics(items.length, expanded),
    [items.length, expanded],
  );
  const shellTransition = reduceMotion ? { duration: 0 } : panelTransition;

  return (
    <motion.div
      initial={false}
      animate={{
        height: metrics.height,
        width: metrics.width,
        borderRadius: metrics.borderRadius,
        paddingLeft: metrics.paddingX,
        paddingRight: metrics.paddingX,
        paddingTop: metrics.paddingTop,
        paddingBottom: metrics.paddingBottom,
      }}
      transition={shellTransition}
      className={cn(
        "overflow-hidden border border-border",
        expanded
          ? "absolute left-0 top-0 z-50 max-h-[min(28rem,calc(100dvh-8rem))] shadow-sm backdrop-blur-md"
          : "relative",
      )}
      style={{
        backgroundColor: expanded ? "var(--background)" : "transparent",
        borderColor: expanded
          ? "var(--border)"
          : "color-mix(in oklch, var(--border) 70%, transparent)",
      }}
    >
      <nav
        className="flex flex-col gap-[0.4375rem]"
        aria-label={expanded ? "Documentation" : undefined}
      >
        {items.map((item) => (
          <NavItemRow
            key={item.href}
            item={item}
            pathname={pathname}
            expanded={expanded}
            reduceMotion={reduceMotion}
          />
        ))}
      </nav>
    </motion.div>
  );
}

/**
 * Desktop margin rail: collapsed skeleton bars in the left gutter, full nav on hover.
 */
export function DocsMarginNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const handleEnter = useCallback(() => {
    clearLeaveTimer();
    setExpanded(true);
  }, [clearLeaveTimer]);

  const handleLeave = useCallback(() => {
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => {
      setExpanded(false);
    }, LEAVE_DELAY_MS);
  }, [clearLeaveTimer]);

  return (
    <aside
      className={cn(
        "sticky top-6 z-20 hidden w-10 shrink-0 self-start min-[980px]:block sm:top-10",
        "max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-5rem)]",
      )}
      aria-label="Documentation"
    >
      <div className="flex flex-col">
        <Link
          href="/"
          className="inline-flex shrink-0 outline-offset-4"
          aria-label="Commandry home"
        >
          <span
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-xl",
              "bg-[#404040] text-[#ececec]",
              "shadow-[inset_0_2.5px_0_0_rgba(255,255,255,0.22),inset_0_-2.5px_0_0_#000]",
              "dark:bg-[#4a4a4a] dark:text-[#f2f2f2]",
              "dark:shadow-[inset_0_2.5px_0_0_rgba(255,255,255,0.18),inset_0_-2.5px_0_0_#000]",
            )}
            aria-hidden
          >
            <Command
              className="size-[1.125rem] shrink-0 [filter:drop-shadow(0_-0.5px_1px_rgba(0,0,0,0.42))_drop-shadow(0_0.5px_1px_rgba(255,255,255,0.36))] dark:[filter:drop-shadow(0_-0.5px_1px_rgba(0,0,0,0.5))_drop-shadow(0_0.5px_1px_rgba(255,255,255,0.28))]"
              strokeWidth={2.25}
            />
          </span>
        </Link>

        <div
          className="relative mt-4"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onFocusCapture={handleEnter}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              handleLeave();
            }
          }}
        >
          <MarginNavPanel
            pathname={pathname}
            expanded={expanded}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>
    </aside>
  );
}
