import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_1_1 = '/class-11/unit-1/1-1-importance-of-chemistry'
const SECTION_1_2 = '/class-11/unit-1/1-2-nature-of-matter'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

async function gotoStep(page: Page, index: number) {
  await page.locator('[data-scrolly-step]').nth(index).evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
  })
}

/** Gives the cross-fade and the tree reveal time to finish. */
const SETTLE_MS = 1000

function screenPath(name: string) {
  fs.mkdirSync(SCREEN_DIR, { recursive: true })
  return path.join(SCREEN_DIR, name)
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Section 1.1 Importance of Chemistry (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('steps through the everyday chemistry Scrolly with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      await page.goto(SECTION_1_1)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Importance of Chemistry')
      await expect(page.locator('[data-scrolly-step]')).toHaveCount(4)
      await waitForScrolly(page)
      await expect(page.locator('.katex-error')).toHaveCount(0)

      for (let i = 0; i < 4; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(SETTLE_MS)
        await expect(page.getByTestId('everyday-chemistry')).toHaveAttribute('data-step', String(i))
        await page.screenshot({ path: screenPath(`u1-1-1-step-${i}-${scheme}.png`) })
      }

      expect(errors).toEqual([])
    })
  })

  test.describe(`Section 1.2 Nature of Matter (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('classifies matter step by step with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      await page.goto(SECTION_1_2)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nature of Matter')
      await expect(page.locator('[data-scrolly-step]')).toHaveCount(6)
      await waitForScrolly(page)
      await expect(page.locator('.katex-error')).toHaveCount(0)

      for (let i = 0; i < 6; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(SETTLE_MS)
        await expect(page.getByTestId('matter-classification')).toHaveAttribute('data-step', String(i))
        await page.screenshot({ path: screenPath(`u1-1-2-step-${i}-${scheme}.png`) })
      }

      expect(errors).toEqual([])
    })

    test('states-of-matter simulation: default and changed state, with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      await page.goto(SECTION_1_2)
      await waitForScrolly(page)

      const sim = page.locator('[data-simulation="states-of-matter"]')
      await sim.scrollIntoViewIfNeeded()
      await expect(page.getByTestId('states-canvas')).toBeVisible()
      await expect(page.getByTestId('states-state')).toHaveText('Liquid (water)')
      await expect(page.getByTestId('states-celsius')).toHaveText('25 °C')
      await expect(page.getByTestId('states-kelvin')).toHaveText('298.15 K')
      await page.waitForTimeout(SETTLE_MS)
      await sim.screenshot({ path: screenPath(`u1-1-2-sim-default-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'Steam' }).click()
      await expect(page.getByTestId('states-state')).toHaveText('Gas (water vapour)')
      await expect(page.getByTestId('states-celsius')).toHaveText('120 °C')
      await expect(page.getByTestId('states-kelvin')).toHaveText('393.15 K')
      await expect(page.getByTestId('states-summary')).toContainText('Water is a gas')
      await page.waitForTimeout(SETTLE_MS)
      await sim.screenshot({ path: screenPath(`u1-1-2-sim-steam-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}

test.describe('Unit 1 Sections (reduced motion)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the classification tree and scenes jump to the Step state', async ({ page }) => {
    await page.goto(SECTION_1_2)
    await waitForScrolly(page)
    await gotoStep(page, 5)
    await expect(page.getByTestId('matter-classification')).toHaveAttribute('data-step', '5')
    await expect(page.locator('[data-node="heterogeneous"]')).toHaveCSS('opacity', '1')
  })

  test('the states-of-matter simulation settles at once when the temperature changes', async ({ page }) => {
    await page.goto(SECTION_1_2)
    await waitForScrolly(page)
    const sim = page.locator('[data-simulation="states-of-matter"]')
    await sim.getByRole('radio', { name: 'Ice' }).click()
    await expect(page.getByTestId('states-state')).toHaveText('Solid (ice)')
    await expect(page.getByTestId('states-celsius')).toHaveText('−10 °C')
  })
})
