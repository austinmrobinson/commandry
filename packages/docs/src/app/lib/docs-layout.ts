/** Dotcom main column — fixed 480px on large screens. */
export const DOCS_ARTICLE_WIDTH = "w-full lg:w-[480px] lg:shrink-0";

/** Logo column (2.5rem) + gap to article (2rem). */
export const DOCS_MARGIN_NAV_GUTTER = "calc(2.5rem + 2rem)";

/** Left cluster: 480px article + margin nav gutter (desktop). */
export const DOCS_LEFT_CLUSTER_WIDTH =
  "w-full min-[980px]:w-[calc(480px+2.5rem+2rem)] min-[980px]:shrink-0";

/** Single-column docs routes: article + nav gutter, left-aligned. */
export const DOCS_LAYOUT_MAX =
  "w-full max-w-[480px] min-[980px]:max-w-[calc(480px+2.5rem+2rem)]";

/** Gap between margin nav and the 480px article column. */
export const DOCS_MARGIN_NAV_GAP = "gap-8";

/** Page padding (matches dotcom `main`). */
export const DOCS_PAGE_PADDING = "p-6 pb-16 sm:p-10";

/** Split row: left cluster + flexible preview column (matches dotcom flex row). */
export const DOCS_SPLIT_ROW =
  "flex w-full flex-col gap-8 min-[980px]:flex-row min-[980px]:items-start min-[980px]:gap-12 xl:min-[980px]:gap-16";

/** Floating chrome for mobile nav / theme toggle (matches dotcom surface treatment). */
export const DOCS_FLOATING_CHROME =
  "border border-border bg-background/90 shadow-sm backdrop-blur-md";
