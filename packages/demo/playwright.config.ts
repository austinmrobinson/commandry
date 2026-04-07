import { defineConfig, devices } from '@playwright/test'

/** Dedicated port avoids clashing with a normal `next dev` on :3000. */
const E2E_PORT = process.env.E2E_PORT ?? '3333'
const baseURL = `http://127.0.0.1:${E2E_PORT}`

/**
 * Production server avoids Next’s “only one dev server per app directory” lock when you
 * already have `next dev` running elsewhere. Slower first run (build); reliable in CI.
 * For a faster local loop: `E2E_USE_DEV=1 pnpm test:e2e` while no other `next dev` uses this package.
 */
const webServerCommand =
  process.env.E2E_USE_DEV === '1'
    ? `pnpm exec next dev --hostname 127.0.0.1 --port ${E2E_PORT}`
    : `pnpm exec next build && pnpm exec next start --hostname 127.0.0.1 --port ${E2E_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: process.env.E2E_USE_DEV === '1' && !process.env.CI,
    timeout: process.env.E2E_USE_DEV === '1' ? 120_000 : 300_000,
  },
})
