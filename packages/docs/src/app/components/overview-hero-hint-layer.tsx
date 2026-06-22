"use client"

import type { CSSProperties, SVGProps } from "react"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react"

import {
  HINT_GAP_MS,
  HINT_SHOW_MS,
  OVERVIEW_HERO_HINTS,
  type HeroHintConfig,
} from "@/app/lib/overview-hero-hints-data"
import { cn } from "@/app/lib/utils"

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function positionFromEdges(
  top: number,
  bottom: number,
  left: number,
  right: number,
): CSSProperties {
  const s: CSSProperties = { position: "absolute" }
  if (right !== 0) s.right = `${right}px`
  else s.left = `${left}px`
  if (bottom !== 0) s.bottom = `${bottom}px`
  else s.top = `${top}px`
  return s
}

function labelAnchorClass(edges: HeroHintConfig): string {
  const fromRight = edges.right !== 0
  return fromRight
    ? "right-0 bottom-full mb-0.5 text-right whitespace-nowrap"
    : "left-0 bottom-full mb-0.5 text-left whitespace-nowrap"
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function easeInCubic(t: number): number {
  return t ** 3
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) ** 2
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    function sync() {
      setReduced(mq.matches)
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return reduced
}

const DRAW_MS = 1300
const TEXT_MS = 620
const EXIT_MS = 750
const TEXT_EXIT_MS = 520

/** Share of the stroke timeline for the long path; the tip uses the rest (after main finishes). */
const MAIN_STROKE_SHARE = 0.78

function mainAndTipStrokeProgress(
  reveal: number,
  exiting: boolean,
): { main: number; tip: number } {
  const r = Math.min(1, Math.max(0, reveal))
  const tipPhaseEnd = 1 - MAIN_STROKE_SHARE
  if (exiting) {
    if (r > tipPhaseEnd) {
      return {
        main: 1,
        tip: (r - tipPhaseEnd) / MAIN_STROKE_SHARE,
      }
    }
    return { main: r / tipPhaseEnd, tip: 0 }
  }
  if (r <= MAIN_STROKE_SHARE) {
    return { main: r / MAIN_STROKE_SHARE, tip: 0 }
  }
  return { main: 1, tip: (r - MAIN_STROKE_SHARE) / tipPhaseEnd }
}

function useHintCycle(
  hintCount: number,
  showMs: number,
  gapMs: number,
  reducedMotion: boolean,
): {
  visibleIndex: number | null
  animKey: number
  isExiting: boolean
} {
  const [visibleIndex, setVisibleIndex] = useState<number | null>(0)
  const [animKey, setAnimKey] = useState(1)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    let cancelled = false
    let i = 0
    const exitWait = reducedMotion ? 0 : EXIT_MS

    async function loop() {
      await sleep(DRAW_MS + showMs)
      if (cancelled) return
      while (!cancelled) {
        setIsExiting(true)
        await sleep(exitWait)
        if (cancelled) return
        setVisibleIndex(null)
        setIsExiting(false)
        await sleep(gapMs)
        if (cancelled) return
        i = (i + 1) % hintCount
        setVisibleIndex(i)
        setAnimKey((k) => k + 1)
        await sleep(DRAW_MS + showMs)
        if (cancelled) return
      }
    }

    void loop()
    return () => {
      cancelled = true
    }
  }, [hintCount, showMs, gapMs, reducedMotion])

  return { visibleIndex, animKey, isExiting }
}

function HintArrowDraw({
  Arrow,
  flipHoriz,
  scale,
  animKey,
  isExiting,
  reducedMotion,
}: {
  Arrow: ComponentType<SVGProps<SVGSVGElement>>
  flipHoriz: boolean
  scale: number
  animKey: number
  isExiting: boolean
  reducedMotion: boolean
}) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const [reveal, setReveal] = useState(0)
  const progress = reducedMotion ? 1 : reveal
  const { main: mainStroke, tip: tipStroke } = mainAndTipStrokeProgress(
    progress,
    isExiting,
  )

  useEffect(() => {
    if (reducedMotion || isExiting) return
    let start: number | null = null
    let frame = 0

    function tick(now: number) {
      if (start === null) start = now
      const u = Math.min(1, (now - start) / DRAW_MS)
      setReveal(easeOutCubic(u))
      if (u < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animKey, reducedMotion, isExiting])

  useEffect(() => {
    if (reducedMotion || !isExiting) return
    let start: number | null = null
    let frame = 0

    function tick(now: number) {
      if (start === null) start = now
      const u = Math.min(1, (now - start) / EXIT_MS)
      const eased = easeInCubic(u)
      setReveal(1 - eased)
      if (u < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isExiting, reducedMotion])

  useLayoutEffect(() => {
    const svg = wrapRef.current?.querySelector("svg")
    if (!svg) return
    const paths = svg.querySelectorAll<SVGPathElement>("path[data-hint-stroke]")
    if (paths.length === 0) {
      svg.querySelectorAll<SVGPathElement>("path").forEach((path) => {
        const len = path.getTotalLength()
        if (len < 0.5) return
        path.style.strokeDasharray = `${len}`
        path.style.strokeDashoffset = `${len * (1 - progress)}`
      })
      return
    }
    paths.forEach((path) => {
      const len = path.getTotalLength()
      if (len < 0.5) return
      const part = path.getAttribute("data-hint-stroke")
      const p = part === "tip" ? tipStroke : mainStroke
      path.style.strokeDasharray = `${len}`
      path.style.strokeDashoffset = `${len * (1 - p)}`
    })
  }, [mainStroke, tipStroke, progress])

  return (
    <span
      ref={wrapRef}
      className={cn(
        "inline-flex",
        flipHoriz ? "origin-center" : "origin-top-left",
      )}
      style={{
        willChange: "transform",
        transform: flipHoriz
          ? `scaleX(-1) scale(${scale})`
          : `scale(${scale})`,
      }}
    >
      <Arrow />
    </span>
  )
}

function HintLabelIn({
  edges,
  animKey,
  isExiting,
  reducedMotion,
}: {
  edges: HeroHintConfig
  animKey: number
  isExiting: boolean
  reducedMotion: boolean
}) {
  const [op, setOp] = useState(0)
  const [yNudge, setYNudge] = useState(10)

  const opacity = reducedMotion ? 1 : op
  const yExtra = reducedMotion ? 0 : yNudge

  useEffect(() => {
    if (reducedMotion || isExiting) return
    let start: number | null = null
    let frame = 0
    const delay = 90

    function tick(now: number) {
      if (start === null) start = now
      const elapsed = now - start - delay
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick)
        return
      }
      const u = Math.min(1, elapsed / TEXT_MS)
      const eased = easeOutQuad(u)
      setOp(eased)
      setYNudge(10 * (1 - eased))
      if (u < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animKey, reducedMotion, isExiting])

  useEffect(() => {
    if (reducedMotion || !isExiting) return
    let start: number | null = null
    let frame = 0

    function tick(now: number) {
      if (start === null) start = now
      const u = Math.min(1, (now - start) / TEXT_EXIT_MS)
      const eased = easeInCubic(u)
      const rev = 1 - eased
      setOp(rev)
      setYNudge(10 * (1 - rev))
      if (u < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isExiting, reducedMotion])

  return (
    <p
      className={`pointer-events-none absolute font-hand-marker text-sm leading-tight tracking-wide text-green-600 dark:text-green-400 ${labelAnchorClass(edges)}`}
      style={{
        opacity,
        transform: `translate(${edges.labelOffsetX}px, ${edges.labelOffsetY + yExtra}px)`,
      }}
    >
      {edges.text}
    </p>
  )
}

export function OverviewHeroHintLayer() {
  const reducedMotion = usePrefersReducedMotion()
  const hints = OVERVIEW_HERO_HINTS
  const { visibleIndex, animKey, isExiting } = useHintCycle(
    hints.length,
    HINT_SHOW_MS,
    HINT_GAP_MS,
    reducedMotion,
  )

  const edges =
    visibleIndex !== null ? hints[visibleIndex] ?? null : null

  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
      {edges ? (
        <div
          key={`${edges.id}-${animKey}`}
          className="opacity-95"
          style={positionFromEdges(
            edges.top,
            edges.bottom,
            edges.left,
            edges.right,
          )}
        >
          <div className="relative inline-block">
            <HintLabelIn
              edges={edges}
              animKey={animKey}
              isExiting={isExiting}
              reducedMotion={reducedMotion}
            />
            <HintArrowDraw
              Arrow={edges.Arrow}
              flipHoriz={edges.flipHoriz}
              scale={edges.arrowScale}
              animKey={animKey}
              isExiting={isExiting}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
