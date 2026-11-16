import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-5-aromatic-hydrocarbons'
const SCROLLIES = [
  { animation: 'benzene-structure', steps: 5, name: 'benzene' },
  { animation: 'huckel-count', steps: 4, name: 'huckel' },
] as const

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - 0.4 * window.innerHeight)
    })
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.5 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('9.5: every Scrolly Step and the Hückel checker render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aromatic Hydrocarbons: Benzene and Aromaticity')

      for (const s of SCROLLIES) {
        await waitForScrolly(page, s.animation)
        await expect(page.locator(`[data-animation="${s.animation}"] [data-scrolly-step]`)).toHaveCount(s.steps)
        for (let i = 0; i < s.steps; i++) {
          await gotoStep(page, s.animation, i)
          await page.waitForTimeout(1200)
          await page
            .locator(`[data-animation="${s.animation}"] [data-testid="scrolly-visual"]`)
            .screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-${s.name}-step${i}-${scheme}.png`) })
        }
      }

      const section = page.locator('[data-simulation="huckel-checker"]')
      await section.scrollIntoViewIfNeeded()
      const lab = section.locator('[data-huckel-rings]')
      await expect(lab).toHaveAttribute('data-huckel-rings', '13')
      await page.waitForTimeout(400)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-huckel-default-${scheme}.png`) })

      // Changed state 1: cyclooctatetraene, answered "No" to flatness and "Non-aromatic" as the verdict.
      await section.locator('[data-ring="cyclooctatetraene"]').click()
      await expect(lab).toHaveAttribute('data-ring', 'cyclooctatetraene')
      const detail = section.getByTestId('huckel-detail')
      await detail.locator('[data-key="flat"]').getByRole('radio', { name: 'No' }).click()
      await detail.locator('[data-key="verdict"]').getByRole('radio', { name: 'Non-aromatic' }).click()
      await expect(detail.locator('[data-key="verdict"]')).toHaveAttribute('data-correct', 'true')
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-huckel-cot-${scheme}.png`) })

      // Changed state 2: benzene, with a wrong verdict, so the reasons show the rule.
      await section.locator('[data-ring="benzene"]').click()
      await detail.locator('[data-key="verdict"]').getByRole('radio', { name: 'Antiaromatic' }).click()
      await expect(section.getByTestId('huckel-reasons')).toBeVisible()
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-huckel-benzene-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
