import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_89 = '/class-11/unit-8/8-9-qualitative-analysis'
const STEP_COUNT = 6
const DEFAULT_FRACTION = 0.4

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
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1600)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u8-8-9-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Section 8.9 (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Lassaigne Scrolly steps and the element detective render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_89)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Qualitative Analysis of Organic Compounds')

      await waitForScrolly(page, 'lassaigne')
      await expect(page.locator('[data-animation="lassaigne"] [data-scrolly-step]')).toHaveCount(STEP_COUNT)
      for (let i = 0; i < STEP_COUNT; i++) await shotStep(page, 'lassaigne', i, 'lassaigne', scheme)

      // Element detective: default state, then a state with tests run and the answer checked, then excess sodium.
      const sim = page.getByTestId('element-detective')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-9-element-default-${scheme}.png`) })

      await page.getByRole('button', { name: 'Fuse, quench and filter' }).click()
      for (const id of ['prussian-blue', 'lead-acetate', 'nitroprusside', 'blood-red']) {
        await page.getByTestId(`test-${id}`).getByRole('button', { name: /Run/ }).click()
      }
      await page.getByTestId('test-silver-nitrate').getByRole('button', { name: /Run/ }).click()
      await page.getByRole('button', { name: 'Check my answer' }).click()
      await expect(page.getByTestId('reveal')).toBeVisible()
      await page.waitForTimeout(1200)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-9-element-tested-${scheme}.png`) })

      await page.getByRole('button', { name: 'Next unknown' }).click()
      await page.getByRole('radio', { name: 'Excess sodium' }).click()
      await page.getByRole('button', { name: 'Fuse, quench and filter' }).click()
      await page.getByTestId('test-blood-red').getByRole('button', { name: /Run/ }).click()
      await page.waitForTimeout(1200)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-9-element-excess-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
