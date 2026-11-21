import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'

const SLUG = '12-2-4-conductance-of-electrolytic-solutions'
const SCREEN_DIR = path.join(process.cwd(), 'test-results', 'screens')

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Local `next start` does not serve Vercel's hosted `/_vercel/insights/script.js` endpoint.
      if (text.includes('Failed to load resource: the server responded with a status of 404')) return
      errors.push(text)
    }
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

async function gotoStep(page: Page, index: number) {
  await page.locator('[data-scrolly-step]').nth(index).evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Conductance Scrolly Animation (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('steps through the conductivity measurement with no console errors', async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-2/${SLUG}`)
      const scrolly = page.locator('[data-animation="conductivity-measurement"]')
      await expect(scrolly).toBeVisible()
      await expect(scrolly.locator('[data-scrolly-step]')).toHaveCount(5)

      for (let i = 0; i < 5; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(600)
        const panel = scrolly.locator('svg').first()
        await expect(panel).toBeVisible()
        await panel.screenshot({ path: path.join(SCREEN_DIR, `c12u2-5-step${i}-${scheme}.png`) })
      }

      await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}
