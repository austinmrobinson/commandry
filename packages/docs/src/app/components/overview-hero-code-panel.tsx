"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { useOverviewHeroDemoBridge } from "@/app/components/overview-hero-demo-bridge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import {
  OVERVIEW_HERO_CODE_TAB_LABEL,
  OVERVIEW_HERO_CODE_TAB_ORDER,
  OVERVIEW_HERO_REGISTRY_FULL,
  OVERVIEW_HERO_REGISTRY_LINE_RANGES,
  OVERVIEW_HERO_SURFACE_SNIPPETS,
  type OverviewHeroPanelTab,
} from "@/app/lib/overview-hero-code-snippets"
import {
  highlightOverviewHeroCode,
  highlightOverviewHeroRegistryCode,
} from "@/app/lib/overview-hero-shiki-client"
import type { HeroToastTrigger } from "@/app/lib/overview-hero-commands"
import { cn } from "@/app/lib/utils"

const BODY_PRE_CLASS =
  "overview-hero-code-shiki overflow-x-auto px-3 py-2.5 [&_pre.shiki]:m-0 [&_pre.shiki]:max-w-none [&_pre.shiki]:bg-transparent [&_pre.shiki]:p-0 [&_pre.shiki]:font-mono [&_pre.shiki]:text-[11px] [&_pre.shiki]:leading-normal"

const SHELL_CLASS =
  "group/docs-code relative overflow-hidden text-foreground"

const HEADER_CLASS =
  "flex min-h-8 items-center border-b border-border px-3 py-1.5"

/** Tab content lives in a local `.dark` subtree — always use dark Shiki so highlights match the surface. */
function useResolvedShikiTheme(): "vitesse-light" | "vitesse-dark" {
  return "vitesse-dark"
}

const ShikiBody = forwardRef<
  HTMLDivElement,
  { html: string; loading: boolean }
>(function ShikiBody({ html, loading }, ref) {
  if (loading) {
    return (
      <div
        ref={ref}
        className={cn(BODY_PRE_CLASS, "min-h-[4rem] animate-pulse bg-muted/50")}
      />
    )
  }
  return (
    <div
      ref={ref}
      className={BODY_PRE_CLASS}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

/** Registry output: `data-line` on each line + taxonomy-style wrapper class for `[data-highlighted-line]` CSS. */
const RegistryShikiBody = forwardRef<
  HTMLDivElement,
  { html: string; loading: boolean }
>(function RegistryShikiBody({ html, loading }, ref) {
  if (loading) {
    return (
      <div
        ref={ref}
        className={cn(
          BODY_PRE_CLASS,
          "overview-hero-registry-shiki min-h-[4rem] animate-pulse bg-muted/50",
        )}
      />
    )
  }
  return (
    <div
      ref={ref}
      className={cn(BODY_PRE_CLASS, "overview-hero-registry-shiki")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

function ShikiHtmlBlock({
  code,
  htmlContainerRef,
  onReady,
}: {
  code: string
  htmlContainerRef?: RefObject<HTMLDivElement | null>
  onReady?: () => void
}) {
  const theme = useResolvedShikiTheme()
  const [html, setHtml] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const out = await highlightOverviewHeroCode(code, { theme })
        if (!cancelled) {
          setHtml(out)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setHtml("")
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code, theme])

  useEffect(() => {
    if (!loading && html) {
      onReady?.()
    }
  }, [loading, html, onReady])

  return <ShikiBody ref={htmlContainerRef} html={html} loading={loading} />
}

function RegistryShikiHtmlBlock({
  code,
  htmlContainerRef,
  onReady,
}: {
  code: string
  htmlContainerRef?: RefObject<HTMLDivElement | null>
  onReady?: () => void
}) {
  const theme = useResolvedShikiTheme()
  const [html, setHtml] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const out = await highlightOverviewHeroRegistryCode(code, theme)
        if (!cancelled) {
          setHtml(out)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setHtml("")
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code, theme])

  useEffect(() => {
    if (!loading && html) {
      onReady?.()
    }
  }, [loading, html, onReady])

  return <RegistryShikiBody ref={htmlContainerRef} html={html} loading={loading} />
}

function CodeBlockChrome({
  title,
  children,
  className,
}: {
  /** Filename bar above the code; omit for a tab-only chrome (overview hero). */
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(SHELL_CLASS, className)}>
      {title ? (
        <div className={HEADER_CLASS}>
          <span className="truncate font-mono text-[11px] font-medium text-muted-foreground">
            {title}
          </span>
        </div>
      ) : null}
      {children}
    </div>
  )
}

function RegistryCommandsSnippet() {
  const { hoveredCommandId, activeTab } = useOverviewHeroDemoBridge()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [layoutTick, setLayoutTick] = useState(0)

  const theme = useResolvedShikiTheme()
  const onReady = useCallback(() => {
    setLayoutTick((n) => n + 1)
  }, [])

  useLayoutEffect(() => {
    const root = bodyRef.current
    if (!root || activeTab !== "commands") return
    const pre = root.querySelector("pre")
    if (!pre) return

    for (const el of pre.querySelectorAll("[data-highlighted-line]")) {
      el.removeAttribute("data-highlighted-line")
    }

    if (!hoveredCommandId) return
    const range = OVERVIEW_HERO_REGISTRY_LINE_RANGES[hoveredCommandId]
    if (!range) return

    for (let n = range.start; n <= range.end; n++) {
      const lineEl = pre.querySelector(`[data-line="${n}"]`)
      if (lineEl) lineEl.setAttribute("data-highlighted-line", "")
    }

    pre
      .querySelector(`[data-line="${range.start}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth", inline: "nearest" })
  }, [hoveredCommandId, activeTab, layoutTick, theme])

  return (
    <CodeBlockChrome className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <RegistryShikiHtmlBlock
          key={`registry-${theme}`}
          code={OVERVIEW_HERO_REGISTRY_FULL}
          htmlContainerRef={bodyRef}
          onReady={onReady}
        />
      </div>
    </CodeBlockChrome>
  )
}

function SurfaceSnippetView({ trigger }: { trigger: HeroToastTrigger }) {
  const snippet = OVERVIEW_HERO_SURFACE_SNIPPETS[trigger]
  const theme = useResolvedShikiTheme()
  return (
    <CodeBlockChrome className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <ShikiHtmlBlock key={`${trigger}-${theme}`} code={snippet.code} />
      </div>
    </CodeBlockChrome>
  )
}

export function OverviewHeroCodePanel({ className }: { className?: string }) {
  const { activeTab, setActiveTab } = useOverviewHeroDemoBridge()

  return (
    <div
      id="overview-hero-code-panel"
      className={cn(
        "flex min-h-0 min-w-0 flex-col gap-0 border-t border-border bg-background min-[980px]:border-t-0",
        className,
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as OverviewHeroPanelTab)}
        className="my-2 mr-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md min-[980px]:border-b min-[980px]:border-r min-[980px]:border-border"
      >
        <div className="overview-hero-code-tablist-chrome shrink-0 overflow-hidden rounded-t-md">
          <TabsList className="shrink-0 gap-1">
            {OVERVIEW_HERO_CODE_TAB_ORDER.map((id) => (
              <TabsTrigger
                key={id}
                value={id}
                className="text-xs"
              >
                {OVERVIEW_HERO_CODE_TAB_LABEL[id]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="dark flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-b-md bg-background min-[980px]:border-l min-[980px]:border-border">
          {OVERVIEW_HERO_CODE_TAB_ORDER.map((id) => (
            <TabsContent
              key={id}
              value={id}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              {id === "commands" ? (
                <RegistryCommandsSnippet />
              ) : (
                <SurfaceSnippetView trigger={id} />
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}
