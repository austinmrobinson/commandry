import { expect, type Page } from '@playwright/test'

/** Modifier for docs only; real chords use {@link dispatchModKeyDown}. */
export function modKey(): 'Meta' | 'Control' {
  return process.platform === 'darwin' ? 'Meta' : 'Control'
}

export function modClickModifier(): 'Meta' | 'Control' {
  return modKey()
}

/**
 * Fires `keydown` on `document` with the correct `metaKey`/`ctrlKey` for `mod` shortcuts
 * (matches Commandry’s `mod` token). Avoids Chromium stealing Meta+K / Meta+, from the page.
 */
export async function dispatchModKeyDown(
  page: Page,
  key: string,
  code: string,
) {
  await page.evaluate(
    ({ key, code }) => {
      const mac =
        /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent) ||
        navigator.platform.toLowerCase().includes('mac')
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key,
          code,
          metaKey: mac,
          ctrlKey: !mac,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { key, code },
  )
}

/**
 * Loads the demo and waits for the client-only mail shell (dynamic import) to hydrate.
 * First inbox thread seed: Alex Rivera / Q4 roadmap draft.
 */
export async function gotoMailApp(page: Page) {
  await page.goto('/')
  await page
    .getByText('Alex Rivera', { exact: false })
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 })
}

export async function openCommandPalette(page: Page) {
  await dispatchModKeyDown(page, 'k', 'KeyK')
  await expect(page.getByPlaceholder('Search commands...')).toBeVisible({
    timeout: 15_000,
  })
}
