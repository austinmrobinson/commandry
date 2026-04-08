"use client";

import { cn } from "@/app/lib/utils";

const CYCLE_S = 16;

/** viewBox coordinates — single source for row layout */
const ROW = {
  h: 32,
  icon: 14,
  gap: 8,
  bar1: { w: 72, h: 8 },
  bar2: { w: 48, h: 6 },
  kbd: { w: 34, h: 13 },
  /** width of one action row including icon, text, kbd */
  rowContentW: 14 + 8 + 72 + 10 + 34,
};

const HOVER_COL_W = 128;

const PALETTE_W = Math.max(ROW.rowContentW + 40, 220);

function ActionRowIcon({ variant }: { variant: 0 | 1 | 2 }) {
  const s = ROW.icon;
  const o = 0.45;
  if (variant === 0) {
    return (
      <rect
        x={1}
        y={1}
        width={s - 2}
        height={s - 2}
        rx={2}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        opacity={o}
      />
    );
  }
  if (variant === 1) {
    return (
      <g stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" opacity={o} fill="none">
        <path d={`M2 ${s * 0.35}h${s - 4}`} />
        <path d={`M2 ${s * 0.65}h${s - 4}`} />
      </g>
    );
  }
  return (
    <circle
      cx={s / 2}
      cy={s / 2}
      r={(s - 3) / 2}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      opacity={o}
    />
  );
}

interface ActionRowProps {
  variant: 0 | 1 | 2;
  showKbd?: boolean;
  kbdPulse?: boolean;
  className?: string;
}

function ActionRow({ variant, showKbd, kbdPulse, className }: ActionRowProps) {
  const { bar1, bar2, kbd, h, icon, gap } = ROW;
  const ix = 0;
  const iy = (h - icon) / 2;
  const textX = icon + gap;
  const bar2y = iy + 11;

  return (
    <g className={cn("text-foreground/80", className)}>
      <g transform={`translate(${ix},${iy})`}>
        <ActionRowIcon variant={variant} />
      </g>
      <rect
        x={textX}
        y={iy + 1}
        width={bar1.w}
        height={bar1.h}
        rx={3}
        className="fill-current opacity-[0.22]"
      />
      <rect
        x={textX}
        y={bar2y}
        width={bar2.w}
        height={bar2.h}
        rx={2}
        className="fill-current opacity-[0.14]"
      />
      {showKbd ? (
        <rect
          x={textX + bar1.w + 10}
          y={iy + 2}
          width={kbd.w}
          height={kbd.h}
          rx={3}
          className={cn(
            "fill-current opacity-[0.18]",
            kbdPulse && "overview-hero-kbd-pulse",
          )}
        />
      ) : null}
    </g>
  );
}

export function OverviewHeroAnimation({ className }: { className?: string }) {
  return (
    <>
      <style>{`
        @keyframes overview-hero-phase-hover {
          0%, 23% { opacity: 1; }
          25%, 100% { opacity: 0; }
        }
        @keyframes overview-hero-phase-ctx {
          0%, 24% { opacity: 0; }
          25%, 48% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes overview-hero-phase-cmdk {
          0%, 49% { opacity: 0; }
          50%, 73% { opacity: 1; }
          75%, 100% { opacity: 0; }
        }
        @keyframes overview-hero-phase-keys {
          0%, 74% { opacity: 0; }
          75%, 99% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes overview-hero-cursor {
          0%, 23% { transform: translate(118px, 132px); }
          25%, 48% { transform: translate(398px, 152px); }
          50%, 73% { transform: translate(292px, 172px); }
          75%, 99% { transform: translate(188px, 132px); }
          100% { transform: translate(118px, 132px); }
        }
        @keyframes overview-hero-kbd-pulse {
          0%, 100% { opacity: 0.18; }
          50% { opacity: 0.42; }
        }
        .overview-hero-animated .overview-hero-phase-hover {
          animation: overview-hero-phase-hover ${CYCLE_S}s linear infinite;
        }
        .overview-hero-animated .overview-hero-phase-ctx {
          animation: overview-hero-phase-ctx ${CYCLE_S}s linear infinite;
        }
        .overview-hero-animated .overview-hero-phase-cmdk {
          animation: overview-hero-phase-cmdk ${CYCLE_S}s linear infinite;
        }
        .overview-hero-animated .overview-hero-phase-keys {
          animation: overview-hero-phase-keys ${CYCLE_S}s linear infinite;
        }
        .overview-hero-animated .overview-hero-cursor-g {
          animation: overview-hero-cursor ${CYCLE_S}s linear infinite;
        }
        .overview-hero-animated .overview-hero-kbd-pulse {
          animation: overview-hero-kbd-pulse 1.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .overview-hero-animated .overview-hero-phase-hover,
          .overview-hero-animated .overview-hero-phase-ctx,
          .overview-hero-animated .overview-hero-phase-cmdk,
          .overview-hero-animated .overview-hero-phase-keys {
            animation: none !important;
          }
          .overview-hero-animated .overview-hero-cursor-g {
            animation: none !important;
            transform: translate(118px, 132px);
          }
          .overview-hero-animated .overview-hero-phase-hover { opacity: 1 !important; }
          .overview-hero-animated .overview-hero-phase-ctx,
          .overview-hero-animated .overview-hero-phase-cmdk,
          .overview-hero-animated .overview-hero-phase-keys {
            opacity: 0 !important;
          }
          .overview-hero-animated .overview-hero-kbd-pulse {
            animation: none !important;
            opacity: 0.28 !important;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 640 360"
        className={cn(
          "h-full w-full text-muted-foreground",
          "overview-hero-animated",
          className,
        )}
        aria-hidden
      >
        <defs>
          <filter id="overview-hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Ambient panel */}
        <rect
          x={40}
          y={100}
          width={560}
          height={160}
          rx={8}
          className="fill-black/[0.03] dark:fill-white/[0.06]"
        />

        {/* Base list row (always visible skeleton item) */}
        <g transform="translate(64, 148)">
          <rect
            width={420}
            height={ROW.h + 8}
            rx={6}
            className="fill-black/[0.04] stroke-black/[0.08] dark:fill-white/[0.06] dark:stroke-white/[0.1]"
            strokeWidth={1}
          />
          <g transform="translate(14, 4)">
            <ActionRow variant={0} />
          </g>
        </g>

        {/* Phase 1: Hover — horizontal strip, same 3 actions + kbds */}
        <g className="overview-hero-phase-hover pointer-events-none" style={{ opacity: 0 }}>
          <g transform="translate(56, 108)">
            <rect
              width={HOVER_COL_W * 3 + 24}
              height={ROW.h + 20}
              rx={6}
              className="fill-background/95 stroke-border/80"
              strokeWidth={1}
              filter="url(#overview-hero-shadow)"
            />
            <g transform="translate(12, 10)">
              <g transform="translate(0, 0)">
                <ActionRow variant={0} showKbd />
              </g>
              <g transform={`translate(${HOVER_COL_W}, 0)`}>
                <ActionRow variant={1} showKbd />
              </g>
              <g transform={`translate(${HOVER_COL_W * 2}, 0)`}>
                <ActionRow variant={2} showKbd />
              </g>
            </g>
          </g>
        </g>

        {/* Phase 2: Context menu — vertical stack, same row geometry */}
        <g className="overview-hero-phase-ctx pointer-events-none" style={{ opacity: 0 }}>
          <g transform="translate(360, 128)">
            <rect
              width={ROW.rowContentW + 20}
              height={ROW.h * 3 + 20}
              rx={6}
              className="fill-background/98 stroke-border/90"
              strokeWidth={1}
              filter="url(#overview-hero-shadow)"
            />
            <g transform="translate(10, 10)">
              <ActionRow variant={0} />
              <g transform={`translate(0, ${ROW.h})`}>
                <ActionRow variant={1} />
              </g>
              <g transform={`translate(0, ${ROW.h * 2})`}>
                <ActionRow variant={2} />
              </g>
            </g>
          </g>
        </g>

        {/* Phase 3: Cmd+K palette */}
        <g className="overview-hero-phase-cmdk pointer-events-none" style={{ opacity: 0 }}>
          <g transform={`translate(${(640 - PALETTE_W) / 2}, 96)`}>
            <rect
              width={PALETTE_W}
              height={168}
              rx={10}
              className="fill-background/98 stroke-border/90"
              strokeWidth={1}
              filter="url(#overview-hero-shadow)"
            />
            {/* Search bar */}
            <rect
              x={14}
              y={14}
              width={PALETTE_W - 28}
              height={30}
              rx={6}
              className="fill-muted/80 stroke-border/60"
              strokeWidth={1}
            />
            <text
              x={26}
              y={34}
              className="fill-current text-[10px] opacity-40"
              style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
            >
              ⌘K
            </text>
            <g transform="translate(14, 54)">
              <ActionRow variant={0} showKbd />
              <g transform={`translate(0, ${ROW.h})`}>
                <ActionRow variant={1} showKbd />
              </g>
              <g transform={`translate(0, ${ROW.h * 2})`}>
                <ActionRow variant={2} showKbd />
              </g>
            </g>
          </g>
        </g>

        {/* Phase 4: Shortcut emphasis — same horizontal strip as hover, kbds pulse */}
        <g className="overview-hero-phase-keys pointer-events-none" style={{ opacity: 0 }}>
          <g transform="translate(56, 108)">
            <rect
              width={HOVER_COL_W * 3 + 24}
              height={ROW.h + 20}
              rx={6}
              className="fill-background/95 stroke-border/80"
              strokeWidth={1}
              filter="url(#overview-hero-shadow)"
            />
            <g transform="translate(12, 10)">
              <g transform="translate(0, 0)">
                <ActionRow variant={0} showKbd kbdPulse />
              </g>
              <g transform={`translate(${HOVER_COL_W}, 0)`}>
                <ActionRow variant={1} showKbd kbdPulse />
              </g>
              <g transform={`translate(${HOVER_COL_W * 2}, 0)`}>
                <ActionRow variant={2} showKbd kbdPulse />
              </g>
            </g>
          </g>
        </g>

        {/* Cursor */}
        <g className="overview-hero-cursor-g" style={{ transform: "translate(118px, 132px)" }}>
          <path
            d="M0 0 L0 18 L5 13 L9 20 L12 18 L8 11 L14 10 Z"
            className="fill-foreground stroke-background"
            strokeWidth={1}
            opacity={0.92}
          />
        </g>
      </svg>
    </>
  );
}
