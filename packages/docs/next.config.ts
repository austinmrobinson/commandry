import type { NextConfig } from "next";
import path from "node:path";

/** Monorepo root when commands run from `packages/docs` — matches workspace lockfile location. */
const monorepoRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
