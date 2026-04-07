import { test, expect } from '@playwright/test'
import { gotoMailApp, modClickModifier } from './fixtures'

test.describe('Context menu', () => {
  test.beforeEach(async ({ page }) => {
    await gotoMailApp(page)
  })

  test('right-click thread row shows Archive and runs it', async ({
    page,
  }) => {
    const row = page
      .getByTestId('thread-row')
      .filter({ hasText: 'Sam Lee' })
      .first()
    await row.click({ button: 'right', force: true })

    const archive = page.getByRole('menuitem', { name: /Archive/i })
    await expect(archive).toBeVisible({ timeout: 15_000 })
    await archive.click()

    await expect(page.getByText('Thread archived')).toBeVisible()
  })

  test('right-click row B archives B when thread A is selected', async ({
    page,
  }) => {
    await page
      .getByTestId('thread-row')
      .filter({ hasText: 'Alex Rivera' })
      .click()
    const rowB = page
      .getByTestId('thread-row')
      .filter({ hasText: 'Sam Lee' })
      .first()
    await rowB.click({ button: 'right', force: true })
    await page.getByRole('menuitem', { name: /Archive/i }).click()
    await expect(page.getByText('Thread archived')).toBeVisible()
    await expect(
      page.getByTestId('thread-row').filter({ hasText: 'Sam Lee' }),
    ).toBeHidden()
  })

  test('multi-select then right-click archives all selected threads', async ({
    page,
  }) => {
    const mod = modClickModifier()
    const rows = page.getByTestId('thread-row')
    await rows.filter({ hasText: 'Alex Rivera' }).click({ modifiers: [mod] })
    await rows.filter({ hasText: 'Billing' }).click({ modifiers: [mod] })
    await rows.filter({ hasText: 'Billing' }).first().click({
      button: 'right',
      force: true,
    })
    await page.getByRole('menuitem', { name: /Archive/i }).click()
    await expect(page.getByText('2 threads archived')).toBeVisible()
  })
})
