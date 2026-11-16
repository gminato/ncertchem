import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-4-alkynes-structure-preparation'
const STEP_COUNT = 4

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
  test.describe(`Unit 9, Section 9.4 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('9.4: every Scrolly Step and the isomer sorter render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alkynes: Structure, Nomenclature and Preparation')

      await waitForScrolly(page, 'triple-bond')
      await expect(page.locator('[data-animation="triple-bond"] [data-scrolly-step]')).toHaveCount(STEP_COUNT)
      for (let i = 0; i < STEP_COUNT; i++) {
        await gotoStep(page, 'triple-bond', i)
        await page.waitForTimeout(1000)
        await page
          .locator('[data-animation="triple-bond"] [data-testid="scrolly-visual"]')
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-triple-step${i}-${scheme}.png`) })
      }

      const section = page.locator('[data-simulation="alkyne-isomers"]')
      const lab = section.locator('[data-isomers]')
      await section.scrollIntoViewIfNeeded()
      await expect(lab).toHaveAttribute('data-n', '5')
      await expect(lab).toHaveAttribute('data-isomers', '3')
      await expect(section.getByTestId('alkyne-readout')).toContainText('C5H8 has 3 isomers')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-isomers-n5-default-${scheme}.png`) })

      await section.locator('[data-name="pent-1-yne"]').click()
      await section.locator('[data-name="pent-2-yne"]').click()
      await expect(section.getByTestId('alkyne-readout')).toContainText('position isomers')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-isomers-n5-position-${scheme}.png`) })

      await section.locator('input[type="range"]').fill('6')
      await expect(lab).toHaveAttribute('data-isomers', '7')
      await expect(section.getByTestId('alkyne-readout')).toContainText('C6H10 has 7 isomers')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-isomers-n6-${scheme}.png`) })

      await section.locator('[data-name="3,3-dimethylbut-1-yne"]').click()
      await section.locator('[data-name="hex-1-yne"]').click()
      await expect(section.getByTestId('alkyne-readout')).toContainText('chain isomers')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-isomers-n6-chain-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
