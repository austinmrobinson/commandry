import type { NextConfig } from "next";
import path from "node:path";

/** Monorepo root (`commandry/`) when commands run from `packages/demo`. */
const monorepoRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  // Monorepo apps need this for correct serverless tracing of workspace packages.
  // Turbopack dev then resolves some CSS imports (e.g. `@import "tailwindcss"`) from
  // `packages/`; those packages must also exist in the root lockfile (see root package.json).
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
