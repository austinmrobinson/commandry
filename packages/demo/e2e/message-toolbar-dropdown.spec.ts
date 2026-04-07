import { test, expect } from '@playwright/test'
import { gotoMailApp } from './fixtures'

test.describe('Message pane toolbar and dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await gotoMailApp(page)
    await page
      .getByTestId('thread-row')
      .filter({ hasText: 'Alex Rivera' })
      .click()
  })

  test('Reply toolbar button shows demo toast', async ({ page }) => {
    const article = page.locator('article').first()
    await article
      .getByRole('button', { name: 'Reply', exact: true })
      .click()
    await expect(page.getByText('Reply opened (demo)')).toBeVisible()
  })

  test('More menu Copy text shows success toast', async ({ page }) => {
    const article = page.locator('article').first()
    await article.getByRole('button', { name: 'More message actions' }).click()
    await page.getByRole('menuitem', { name: /Copy text/i }).click()
    await expect(
      page.getByText('Text copied to clipboard'),
    ).toBeVisible()
  })

  test('Important toggle in More menu shows toast', async ({ page }) => {
    const article = page.locator('article').first()
    await article.getByRole('button', { name: 'More message actions' }).click()
    await page
      .getByRole('menuitemcheckbox', { name: /Important/i })
      .click()
    await expect(page.getByText('Marked as important')).toBeVisible()
  })

  test('Escape closes More message actions menu', async ({ page }) => {
    const article = page.locator('article').first()
    await article.getByRole('button', { name: 'More message actions' }).click()
    await expect(
      page.getByRole('menuitem', { name: /Copy text/i }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(
      page.getByRole('menuitem', { name: /Copy text/i }),
    ).toBeHidden({ timeout: 10_000 })
  })
})
