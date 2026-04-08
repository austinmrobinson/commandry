"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "commandry-docs:package-manager";

export type PackageManagerId = "npm" | "pnpm" | "yarn";

const DEFAULT_PM: PackageManagerId = "pnpm";

const listeners = new Set<() => void>();

function parsePm(value: string | null): PackageManagerId {
  if (value === "npm" || value === "pnpm" || value === "yarn") return value;
  return DEFAULT_PM;
}

export function getPackageManager(): PackageManagerId {
  if (typeof window === "undefined") return DEFAULT_PM;
  return parsePm(localStorage.getItem(STORAGE_KEY));
}

export function setPackageManager(pm: PackageManagerId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, pm);
  listeners.forEach((l) => l());
}

function subscribePackageManager(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  listeners.add(onChange);
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
    listeners.delete(onChange);
  };
}

function getServerPackageManager(): PackageManagerId {
  return DEFAULT_PM;
}

/** Persisted package manager for install code blocks (localStorage). */
export function usePackageManager() {
  return useSyncExternalStore(
    subscribePackageManager,
    getPackageManager,
    getServerPackageManager,
  );
}

export function useSetPackageManager() {
  return useCallback((pm: PackageManagerId) => {
    setPackageManager(pm);
  }, []);
}
