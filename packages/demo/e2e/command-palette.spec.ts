import { test, expect } from '@playwright/test'
import {
  gotoMailApp,
  modClickModifier,
  openCommandPalette,
} from './fixtures'

test.describe('Command palette (cmdk)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoMailApp(page)
  })

  test('opens with Mod+K and shows search input', async ({ page }) => {
    await openCommandPalette(page)
    await expect(page.getByPlaceholder('Search commands...')).toBeVisible()
  })

  test('Toggle theme via palette updates document theme class', async ({
    page,
  }) => {
    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)

    await openCommandPalette(page)
    await page.getByPlaceholder('Search commands...').fill('theme')
    await page.getByRole('option', { name: /Toggle theme/i }).click()

    await expect(page.getByText(/Switched to dark mode/i)).toBeVisible()
    await expect(html).toHaveClass(/dark/)
  })

  test('Label radio flow: pick Work for selected thread', async ({ page }) => {
    await page.getByTestId('thread-row').filter({ hasText: 'Alex Rivera' }).click()
    await openCommandPalette(page)
    await page.getByPlaceholder('Search commands...').fill('label')
    await page.getByRole('option', { name: /^Label$/ }).click()
    await expect(page.getByPlaceholder(/choose label/i)).toBeVisible()
    await page.getByRole('option', { name: /^Work$/ }).click()
    await expect(page.getByText(/labeled Work/i)).toBeVisible()
  })

  test('pinned scope: pointer on message pane shows selected thread in Archive group', async ({
    page,
  }) => {
    await page
      .getByTestId('thread-row')
      .filter({ hasText: 'Alex Rivera' })
      .click()
    await page.locator('article').first().hover()
    await openCommandPalette(page)
    await page.getByPlaceholder('Search commands...').fill('archive')
    await expect(
      page.getByRole('dialog').getByText(/Thread · .*Q4 roadmap draft/i),
    ).toBeVisible()
  })

  test('pinned scope: hovered row targets that thread for palette archive', async ({
    page,
  }) => {
    await page
      .getByTestId('thread-row')
      .filter({ hasText: 'Alex Rivera' })
      .click()
    const billingRow = page.locator('[data-thread-id="t2"]').first()
    await billingRow.scrollIntoViewIfNeeded()
    await billingRow.hover()
    await openCommandPalette(page)
    await page.getByPlaceholder('Search commands...').fill('archive')
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('option', { name: /Archive/i }).first().click()
    await expect(page.getByText('Thread archived')).toBeVisible()
    await expect(billingRow).toBeHidden()
  })

  test('multi-select shows single list-scoped Archive and runs bulk', async ({
    page,
  }) => {
    const mod = modClickModifier()
    const rows = page.getByTestId('thread-row')
    await rows.filter({ hasText: 'Alex Rivera' }).click({ modifiers: [mod] })
    await rows.filter({ hasText: 'Billing' }).click({ modifiers: [mod] })
    await expect(page.getByTestId('bulk-toolbar')).toBeVisible()
    await openCommandPalette(page)
    await page.getByPlaceholder('Search commands...').fill('archive')
    const archiveItem = page
      .locator('[data-slot="command-item"]')
      .filter({ hasText: /Archive/ })
      .first()
    await expect(archiveItem).toBeVisible({ timeout: 15_000 })
    await archiveItem.click()
    await expect(page.getByText('2 threads archived')).toBeVisible()
  })
})

test.describe('Command palette close', () => {
  test('Escape closes palette', async ({ page }) => {
    await gotoMailApp(page)
    await openCommandPalette(page)
    await page.keyboard.press('Escape')
    await expect(page.getByPlaceholder('Search commands...')).toBeHidden({
      timeout: 10_000,
    })
  })
})
