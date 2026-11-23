import { test, expect } from '@playwright/test'
import { watchErrors, expectCleanSvg, expectNoSidewaysScroll } from './support/svg-audit'

// Template: replace the four constants. Keep the checks; add Step-specific expects where useful.
const SLUG = '12-8-1-nomenclature-and-structure-of-carbonyl-group'
const ANIMATION = 'carbonyl-group'
const STEP_COUNT = 6
const TAG = 'c12u8-1' // e.g. c12u8-3: screenshots go to test-results/screens/<TAG>-step<k>-<scheme>.png

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${TAG} Scrolly (${scheme})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })

    test('every Step renders cleanly', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-8/${SLUG}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
      const steps = scrolly.locator('[data-scrolly-step]')
      await expect(steps).toHaveCount(STEP_COUNT)
      for (let k = 0; k < STEP_COUNT; k++) {
        await steps.nth(k).scrollIntoViewIfNeeded()
        await page.waitForTimeout(900)
        const panel = scrolly.locator('svg').first()
        await expect(panel).toBeVisible()
        await panel.screenshot({ path: `test-results/screens/${TAG}-step${k + 1}-${scheme}.png` })
        await expectCleanSvg(panel, { minPx: 13 }, `Step ${k + 1} (${scheme})`)
      }
      if (await page.locator('.katex-display').count()) await expect(page.locator('.katex-error')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test(`${TAG} Section does not scroll sideways at 390 px`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/class-12/unit-8/${SLUG}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expectNoSidewaysScroll(page)
})
