import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-5-5-properties-of-arenes'
const STEP_COUNT = 6

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  // In the wide layout the active Step is the last one that has risen into the band under the visual.
  await expect(root.locator('[data-scrolly-step][data-active="true"]')).toHaveCount(1)
  return root
}

/** Moves the page so the Step is the active one. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      // Wide layout: a Step is active while its top is above 97% of the viewport and the next one is below it.
      window.scrollBy(0, top - 0.9 * window.innerHeight)
    })
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.5.5 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('9.5.5: every Scrolly Step and the electrophilic substitution workbench render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Properties of Aromatic Hydrocarbons')

      await waitForScrolly(page, 'eas-mechanism')
      await expect(page.locator('[data-animation="eas-mechanism"] [data-scrolly-step]')).toHaveCount(STEP_COUNT)
      for (let i = 0; i < STEP_COUNT; i++) {
        await gotoStep(page, 'eas-mechanism', i)
        await page.waitForTimeout(600)
        await page
          .locator('[data-animation="eas-mechanism"] [data-testid="scrolly-visual"]')
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-5-eas-step${i + 1}-${scheme}.png`) })
      }

      const section = page.locator('[data-simulation="eas-workbench"]')
      const lab = section.locator('[data-reaction]')
      await section.scrollIntoViewIfNeeded()
      await expect(lab).toHaveAttribute('data-reaction', 'nitration')
      await expect(section.getByTestId('eas-readout')).toContainText('Put the four stages')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-5-workbench-default-${scheme}.png`) })

      // A wrong order is refused, then the right one unlocks the stages.
      await section.getByRole('button', { name: 'Check the order' }).click()
      await expect(section.getByTestId('eas-readout')).toContainText('Not yet')
      // Start order: attack, restore, generate, deprotonate. Move generate to the top, then deprotonate above restore.
      await section.locator('[data-stage-id="generate"] button').nth(0).click()
      await section.locator('[data-stage-id="generate"] button').nth(0).click()
      await section.locator('[data-stage-id="deprotonate"] button').nth(0).click()
      await section.getByRole('button', { name: 'Check the order' }).click()
      await expect(lab).toHaveAttribute('data-order-verdict', 'right')
      await expect(section.getByRole('button', { name: 'Play the mechanism' })).toBeEnabled()
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-5-workbench-order-${scheme}.png`) })

      for (let stage = 1; stage <= 4; stage++) {
        await section.getByRole('button', { name: 'Next stage' }).click()
        await expect(lab).toHaveAttribute('data-stage', String(stage))
        await page.waitForTimeout(300)
        await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-5-workbench-nitration-stage${stage}-${scheme}.png`) })
      }

      // Friedel–Crafts alkylation: the methyl cation and the σ-complex that loses H⁺ to AlCl₄⁻.
      await section.locator('[data-id="alkylation"]').click()
      await expect(section.getByTestId('eas-readout')).toContainText('Put the four stages')
      await section.getByRole('button', { name: 'Check the order' }).click()
      await expect(lab).toHaveAttribute('data-order-verdict', 'wrong')
      await section.locator('[data-stage-id="generate"] button').nth(0).click()
      await section.locator('[data-stage-id="generate"] button').nth(0).click()
      await section.locator('[data-stage-id="deprotonate"] button').nth(0).click()
      await section.getByRole('button', { name: 'Check the order' }).click()
      await expect(lab).toHaveAttribute('data-order-verdict', 'right')
      for (let stage = 1; stage <= 4; stage++) {
        await section.getByRole('button', { name: 'Next stage' }).click()
        await expect(lab).toHaveAttribute('data-stage', String(stage))
      }
      await expect(section.getByTestId('eas-readout')).toContainText('methylbenzene')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-5-workbench-alkylation-product-${scheme}.png`) })

      // An addition has no order to set: the product is shown at once.
      await section.locator('[data-id="bhc"]').click()
      await expect(section.getByRole('button', { name: 'Check the order' })).toHaveCount(0)
      await section.getByRole('button', { name: 'Show the product' }).click()
      await expect(lab).toHaveAttribute('data-stage', '4')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-5-5-workbench-bhc-product-${scheme}.png`) })

      // Labels and readouts are at least 14 px.
      const sizes = await section.locator('button, p').evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)))
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14)

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
