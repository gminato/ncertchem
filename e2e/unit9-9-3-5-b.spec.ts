import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-3-5-oxidation-ozonolysis-polymerisation'
const ANIMATION = 'alkene-cleavage'
const SIM = 'ozonolysis-detective'
const STEP_NAMES = ['baeyer', 'diol', 'cut', 'products', 'reverse', 'polymer'] as const
// The wide layout activates a Step once it rises into the band just above the 97% line, so park it near 0.9.
const DEFAULT_FRACTION = 0.9

/** Waits for hydration and the Scrolly's first Step to be marked active. */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Scrolls so that the Step is the active one. */
async function gotoStep(page: Page, index: number) {
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.3.5 part 2 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly Steps and the ozonolysis detective render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Properties of Alkenes: Oxidation, Ozonolysis and Polymerisation')

      const root = await waitForScrolly(page)
      await expect(root.locator('[data-scrolly-step]')).toHaveCount(6)
      for (let i = 0; i < 6; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(1100)
        await root.getByTestId('scrolly-visual').screenshot({
          path: path.join(SCREEN_DIR, `u9-9-3-5-b-step${i + 1}-${STEP_NAMES[i]}-${scheme}.png`),
        })
      }

      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-b-sim-forward-default-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'Preset' }).click()
      await sim.getByRole('radio', { name: 'Acidic' }).click().catch(() => undefined)
      await sim.getByRole('radio', { name: 'Hot acidic KMnO₄' }).click()
      await sim.getByRole('radio', { name: '1-methylcyclohexene' }).click()
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-b-sim-forward-acidic-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'Penta-1,3-diene' }).click()
      await sim.getByRole('radio', { name: 'Ozone, then Zn and water' }).click()
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-b-sim-forward-diene-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'Reverse: products to alkene' }).click()
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-b-sim-reverse-default-${scheme}.png`) })

      const carbonyls = sim.locator('circle[role="button"]')
      await carbonyls.nth(0).click()
      await carbonyls.nth(1).click()
      await expect(sim.getByTestId('reverse-readout')).toContainText('Joined: 2-methylbut-2-ene')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-b-sim-reverse-joined-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
