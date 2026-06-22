import * as React from "react"

import { cn } from "@/app/lib/utils"

function Item({
  className,
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "outline" | "muted"
  size?: "default" | "sm"
}) {
  return (
    <div
      data-slot="item"
      className={cn(
        "group/item flex w-full flex-wrap items-center gap-3 rounded-md border border-border bg-background text-sm transition-colors hover:bg-muted/55 hover:border-border/80 dark:hover:bg-muted/40 dark:hover:border-white/15",
        variant === "muted" && "bg-muted/40",
        size === "sm" ? "p-2 pl-3" : "p-2.5 pl-3.5",
        className
      )}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn("truncate font-medium leading-none", className)}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn("line-clamp-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn(
        "item-actions-reveal flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/item:opacity-100 group-focus-within/item:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function ItemMedia({
  className,
  variant = "icon",
  ...props
}: React.ComponentProps<"div"> & { variant?: "icon" | "image" }) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(
        "flex shrink-0 items-center justify-center",
        variant === "image"
          ? "size-9 overflow-hidden rounded-md border border-border bg-muted/50"
          : "text-muted-foreground [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

export { Item, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemMedia }
