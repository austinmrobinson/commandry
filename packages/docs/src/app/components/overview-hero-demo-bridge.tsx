"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react"

import type { HeroToastTrigger } from "@/app/lib/overview-hero-commands"
import type { OverviewHeroPanelTab } from "@/app/lib/overview-hero-code-snippets"

export interface OverviewHeroHandle {
  demoSurface(trigger: HeroToastTrigger): void
}

export type { OverviewHeroPanelTab }

interface OverviewHeroDemoBridgeValue {
  activeTab: OverviewHeroPanelTab
  /** Tab change: opening a surface tab also runs `demoSurface` once; Commands tab does not. */
  setActiveTab: (tab: OverviewHeroPanelTab) => void
  /** Hero only: keep tab in sync when user runs a command; does not re-open surfaces. */
  syncActiveSurfaceFromDemo: (trigger: HeroToastTrigger) => void
  hoveredCommandId: string | null
  setHoveredCommandId: (id: string | null) => void
  /** Wide layout: second column is the Shiki code panel; hero toggle can hide it. */
  codePanelExpanded: boolean
  toggleCodePanel: () => void
}

const OverviewHeroDemoBridgeContext =
  createContext<OverviewHeroDemoBridgeValue | null>(null)

export function OverviewHeroDemoBridgeProvider({
  children,
  heroRef,
}: {
  children: ReactNode
  heroRef: RefObject<OverviewHeroHandle | null>
}) {
  const [activeTab, setActiveTabState] =
    useState<OverviewHeroPanelTab>("commands")
  const [hoveredCommandId, setHoveredCommandIdState] = useState<string | null>(
    null,
  )
  const [codePanelExpanded, setCodePanelExpanded] = useState(true)

  const toggleCodePanel = useCallback(() => {
    setCodePanelExpanded((v) => !v)
  }, [])

  const syncActiveSurfaceFromDemo = useCallback((trigger: HeroToastTrigger) => {
    setActiveTabState(trigger)
  }, [])

  const setActiveTab = useCallback(
    (tab: OverviewHeroPanelTab) => {
      setActiveTabState(tab)
      if (tab === "commands") return
      queueMicrotask(() => {
        heroRef.current?.demoSurface(tab)
      })
    },
    [heroRef],
  )

  const setHoveredCommandId = useCallback((id: string | null) => {
    setHoveredCommandIdState(id)
    if (id) setActiveTabState("commands")
  }, [])

  const value = useMemo(
    (): OverviewHeroDemoBridgeValue => ({
      activeTab,
      setActiveTab,
      syncActiveSurfaceFromDemo,
      hoveredCommandId,
      setHoveredCommandId,
      codePanelExpanded,
      toggleCodePanel,
    }),
    [
      activeTab,
      setActiveTab,
      syncActiveSurfaceFromDemo,
      hoveredCommandId,
      setHoveredCommandId,
      codePanelExpanded,
      toggleCodePanel,
    ],
  )

  return (
    <OverviewHeroDemoBridgeContext.Provider value={value}>
      {children}
    </OverviewHeroDemoBridgeContext.Provider>
  )
}

export function useOverviewHeroDemoBridge(): OverviewHeroDemoBridgeValue {
  const ctx = useContext(OverviewHeroDemoBridgeContext)
  if (!ctx) {
    throw new Error(
      "useOverviewHeroDemoBridge must be used within OverviewHeroDemoBridgeProvider",
    )
  }
  return ctx
}

export function useOptionalOverviewHeroDemoBridge():
  | OverviewHeroDemoBridgeValue
  | undefined {
  return useContext(OverviewHeroDemoBridgeContext) ?? undefined
}
