"use client"

import * as React from "react"

import { cn } from "@/app/lib/utils"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useMemo(
    () => ({ value, onValueChange }),
    [value, onValueChange],
  )
  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-0", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "relative isolate flex h-9 min-w-0 flex-nowrap items-stretch gap-0 overflow-x-auto overflow-y-hidden bg-transparent [scrollbar-width:thin]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs")
  const selected = ctx.value === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      data-state={selected ? "active" : "inactive"}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "relative z-0 border border-border border-b-0 flex h-full min-h-0 shrink-0 self-stretch items-center whitespace-nowrap rounded-t-md px-3 py-0 text-[11px] font-medium leading-none transition-colors",
        selected
          ? "z-10  bg-background text-foreground after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:z-10 after:h-[3px] after:bg-background"
          : "bg-muted text-muted-foreground hover:bg-muted/90 hover:text-foreground dark:hover:bg-muted/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be used within Tabs")
  if (ctx.value !== value) return null
  return (
    <div role="tabpanel" className={cn("min-h-0 flex-1", className)}>
      {children}
    </div>
  )
}
