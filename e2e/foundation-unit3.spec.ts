import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
] as const

for (const scheme of ['light', 'dark'] as const) {
  for (const viewport of VIEWPORTS) {
    test.describe(`Unit 3 periodic table on /vocab (${scheme}, ${viewport.width})`, () => {
      test.use({ colorScheme: scheme, viewport })

      test('renders the periodic section and keeps the console clean', async ({ page }) => {
        const errors: string[] = []
        page.on('pageerror', (err) => errors.push(err.message))
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text())
        })

        fs.mkdirSync(SCREEN_DIR, { recursive: true })
        await page.goto('/vocab#periodic')

        const section = page.locator('#periodic')
        await expect(section.getByRole('heading', { level: 2 })).toHaveText(
          'Periodic table and trends'
        )
        await expect(section.getByRole('group', { name: /Periodic table of the fixture/ })).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        await section.screenshot({
          path: path.join(SCREEN_DIR, `vocab-unit3-${scheme}-${viewport.width}.png`),
        })

        expect(errors).toEqual([])
      })
    })
  }
}

test.describe('Unit 3 periodic table keyboard navigation', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('arrow keys move focus across and down the table', async ({ page }) => {
    await page.goto('/vocab#periodic')

    // The page has three tables. Scope to the block-shaded one.
    const table = page.getByRole('group', { name: /shaded by block/ })
    const hydrogen = table.locator('[data-z="1"]')
    await hydrogen.focus()
    await expect(page.locator(':focus')).toHaveAttribute('data-z', '1')

    await page.keyboard.press('ArrowRight')
    await expect(page.locator(':focus')).toHaveAttribute('data-z', '2')

    await page.keyboard.press('ArrowDown')
    // Helium sits in group 18, so the next occupied cell down is Neon (Z 10).
    await expect(page.locator(':focus')).toHaveAttribute('data-z', '10')
  })

  test('Enter selects the focused cell and marks it current', async ({ page }) => {
    await page.goto('/vocab#periodic')
    const table = page.getByRole('group', { name: /shaded by block/ })
    // Sodium starts selected, so move to Lithium first, then select Sodium with Enter.
    await table.locator('[data-z="3"]').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator(':focus')).toHaveAttribute('data-z', '11')
    await page.keyboard.press('Enter')
    const sodium = table.locator('[data-z="11"]')
    await expect(sodium).toHaveAttribute('aria-current', 'true')
    await expect(page.locator('#periodic [role="status"]')).toContainText('Sodium, Z 11')
  })
})
