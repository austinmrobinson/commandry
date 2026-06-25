import type { SVGProps } from "react"

import { cn } from "@/app/lib/utils"

const svgBase =
  "block w-auto shrink-0 overflow-visible text-green-600 dark:text-green-400"

const strokeProps = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 14,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

/** Long curve; tip strokes are separate so they can animate after the body. */
const RIGHT_CLICK_MAIN =
  "M472.624 8.00113C480.246 57.8936 481.355 181.793 424.81 278.252C354.129 398.826 231.68 411.151 200.294 402.983C168.908 394.815 178.466 340.618 233.555 318.79C288.645 296.962 352.05 282.41 371.799 361.406C391.548 440.403 330.222 546.424 253.305 615.026C191.771 669.908 64.129 739.065 8 766.783"
const RIGHT_CLICK_TIP =
  "M8 766.783L22.1591 713.94M8 766.783L58.7773 780.388"

const CMDK_MAIN =
  "M304.146 8.00183C300.664 22.5358 285.343 53.693 251.915 62.05C210.129 72.4964 184.541 53.4793 161.022 60.5043C137.504 67.5292 124.676 88.2987 116.735 112.733C108.793 137.168 99.3247 181.151 8 168.628"
const CMDK_TIP =
  "M8 168.628C10.5452 174.635 21.0113 189.581 42.5139 201.309M8 168.628C12.7851 160.585 27.3643 141.505 47.4008 129.532"

const TOOLBAR_MAIN =
  "M169.075 8.00134C149.33 19.5326 106.332 54.0632 92.305 99.9357C74.771 157.276 63.3567 206.987 107.469 232.624C153.957 259.643 164.575 205.829 147.276 174.336C128.179 139.571 86.6928 105.864 40.1771 133.108C-12.471 163.944 11.7439 270.536 27.3822 309.868C39.8929 341.334 69.2425 389.324 82.3534 409.385"
const TOOLBAR_TIP =
  "M82.3534 409.385C85.8286 402.434 93.3476 384.743 95.6223 369.578M82.3534 409.385C74.7712 409.227 56.3844 407.489 43.4945 401.803"

export function HeroHintArrowRightClick({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 485 789"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn(svgBase, "h-36 max-w-[min(100%,12rem)]", className)}
      {...props}
    >
      <path data-hint-stroke="main" d={RIGHT_CLICK_MAIN} {...strokeProps} />
      <path data-hint-stroke="tip" d={RIGHT_CLICK_TIP} {...strokeProps} />
    </svg>
  )
}

export function HeroHintArrowCmdK({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 313 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn(svgBase, "h-20 max-w-[min(100%,11rem)]", className)}
      {...props}
    >
      <path data-hint-stroke="main" d={CMDK_MAIN} {...strokeProps} />
      <path data-hint-stroke="tip" d={CMDK_TIP} {...strokeProps} />
    </svg>
  )
}

export function HeroHintArrowToolbar({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 178 418"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn(svgBase, "h-28 max-w-[min(100%,9rem)]", className)}
      {...props}
    >
      <path data-hint-stroke="main" d={TOOLBAR_MAIN} {...strokeProps} />
      <path data-hint-stroke="tip" d={TOOLBAR_TIP} {...strokeProps} />
    </svg>
  )
}
