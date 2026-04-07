import { test, expect } from '@playwright/test'
import { dispatchModKeyDown, gotoMailApp } from './fixtures'

test.describe('Keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await gotoMailApp(page)
  })

  test('sequence g then i navigates from Sent to Inbox', async ({ page }) => {
    await page.getByRole('button', { name: /Sent/i }).click()
    await expect(
      page.getByTestId('thread-row').filter({ hasText: 'Launch checklist' }),
    ).toBeVisible()

    await page.keyboard.press('g')
    await page.keyboard.press('i')

    await expect(
      page.getByTestId('thread-row').filter({ hasText: 'Alex Rivera' }),
    ).toBeVisible()
  })

  test('Mod+, opens settings toast', async ({ page }) => {
    await dispatchModKeyDown(page, ',', 'Comma')
    await expect(page.getByText('Settings opened (demo)')).toBeVisible()
  })

  test('thread-scoped e archives after hovering thread row', async ({
    page,
  }) => {
    const row = page
      .getByTestId('thread-row')
      .filter({ hasText: 'Billing' })
      .first()
    await row.hover()
    await page.keyboard.press('KeyE')
    await expect(page.getByText('Thread archived')).toBeVisible()
  })

  test('e archives selected thread when pointer is on message pane', async ({
    page,
  }) => {
    await page
      .getByTestId('thread-row')
      .filter({ hasText: 'Alex Rivera' })
      .click()
    await page.locator('article').first().hover()
    await page.keyboard.press('KeyE')
    await expect(page.getByText('Thread archived')).toBeVisible()
  })

  test('r opens reply when pointer is on message pane', async ({ page }) => {
    await page
      .getByTestId('thread-row')
      .filter({ hasText: 'Alex Rivera' })
      .click()
    await page.locator('article').first().hover()
    await page.keyboard.press('KeyR')
    await expect(page.getByText('Reply opened (demo)')).toBeVisible()
  })
})
