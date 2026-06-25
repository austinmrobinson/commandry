"use client";

import { useEffect } from "react";

/**
 * Loads CSS Studio only in development; omitted from production bundles via dead-code elimination.
 */
export function CssStudioDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    void import("cssstudio").then(({ startStudio }) => {
      startStudio();
    });
  }, []);

  return null;
}
