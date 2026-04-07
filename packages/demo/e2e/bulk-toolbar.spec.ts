import { test, expect } from '@playwright/test'
import { gotoMailApp, modClickModifier } from './fixtures'

test.describe('Bulk toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoMailApp(page)
  })

  test('modifier-click two threads shows bulk bar and archive', async ({
    page,
  }) => {
    const mod = modClickModifier()
    const rows = page.getByTestId('thread-row')
    await rows.nth(0).click({ modifiers: [mod] })
    await rows.nth(1).click({ modifiers: [mod] })

    const bulkBar = page.getByTestId('bulk-toolbar')
    await expect(bulkBar).toBeVisible()
    await expect(bulkBar.getByText('2 selected')).toBeVisible()

    await bulkBar.getByRole('button', { name: 'Archive' }).click()
    await expect(page.getByText('2 threads archived')).toBeVisible()
  })

  test('Escape clears multi-selection', async ({ page }) => {
    const mod = modClickModifier()
    const rows = page.getByTestId('thread-row')
    await rows.nth(0).click({ modifiers: [mod] })

    const bulkBar = page.getByTestId('bulk-toolbar')
    await expect(bulkBar.getByText(/^1 selected$/)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(bulkBar).toBeHidden()
  })
})
