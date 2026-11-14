import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-1/1-10-stoichiometry'
const SCREEN_DIR = path.join('test-results', 'screens')

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

function screenPath(name: string) {
  return path.join(SCREEN_DIR, `${name}.png`)
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 1.10 Stoichiometry (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('both Scrolly Animations step through, with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Stoichiometry and Stoichiometric Calculations'
      )
      await expect(page.locator('[data-scrolly-step]')).toHaveCount(8)
      await waitForScrolly(page)

      // Reading the equation: Steps 0 to 3.
      await expect(page.getByTestId('reaction-reading')).toHaveCount(1)
      for (let i = 0; i < 4; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(900)
        await expect(page.getByTestId('reaction-reading')).toHaveAttribute('data-step', String(i))
        await page
          .getByTestId('scrolly-visual')
          .first()
          .screenshot({ path: screenPath(`u1-1-10-stoichiometry-reading-step-${i}-${scheme}`) })
      }

      // Concentration vessels: Steps 4 to 7.
      await expect(page.getByTestId('concentration-vessels')).toHaveCount(1)
      for (let i = 0; i < 4; i++) {
        await gotoStep(page, 4 + i)
        await page.waitForTimeout(1000)
        await expect(page.getByTestId('concentration-vessels')).toHaveAttribute('data-step', String(i))
        await page
          .getByTestId('scrolly-visual')
          .nth(1)
          .screenshot({ path: screenPath(`u1-1-10-stoichiometry-vessels-step-${i}-${scheme}`) })
      }

      expect(errors).toEqual([])
    })

    test('limiting-reagent Simulation: default and reacted states, with no console errors', async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await waitForScrolly(page)

      const sim = page.locator('[data-simulation="limiting-reagent"]')
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.getByTestId('limiting-reagent-reactor')).toBeVisible()
      await expect(sim.getByTestId('limiting-label')).toHaveCount(1)
      await page.waitForTimeout(400)
      await sim.screenshot({ path: screenPath(`u1-1-10-stoichiometry-sim-default-${scheme}`) })

      await sim.getByRole('button', { name: 'React' }).click()
      await expect(sim.getByTestId('limiting-label')).toBeVisible()
      await page.waitForTimeout(1500)
      await sim.screenshot({ path: screenPath(`u1-1-10-stoichiometry-sim-running-${scheme}`) })
      await expect(sim.getByTestId('limiting-reagent-reactor')).toHaveAttribute('data-status', 'done', {
        timeout: 8000,
      })
      await page.waitForTimeout(300)
      await sim.screenshot({ path: screenPath(`u1-1-10-stoichiometry-sim-reacted-${scheme}`) })

      // A different reaction and counts, then reacted again.
      await sim.getByRole('radio', { name: 'CH₄ + 2O₂ → CO₂ + 2H₂O' }).click()
      await expect(sim.getByTestId('limiting-reagent-reactor')).toHaveAttribute('data-status', 'idle')
      await sim.getByRole('button', { name: 'React' }).click()
      await expect(sim.getByTestId('limiting-reagent-reactor')).toHaveAttribute('data-status', 'done', {
        timeout: 8000,
      })
      await page.waitForTimeout(300)
      await sim.screenshot({ path: screenPath(`u1-1-10-stoichiometry-sim-changed-${scheme}`) })

      expect(errors).toEqual([])
    })
  })
}

test.describe('Unit 1.10 Stoichiometry (reduced motion)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the Simulation cuts straight to the result', async ({ page }) => {
    await page.goto(SECTION_URL)
    await waitForScrolly(page)

    const sim = page.locator('[data-simulation="limiting-reagent"]')
    await sim.scrollIntoViewIfNeeded()
    await sim.getByRole('button', { name: 'React' }).click()
    await expect(sim.getByTestId('limiting-reagent-reactor')).toHaveAttribute('data-status', 'done')
    await expect(sim.getByRole('table')).toBeVisible()
  })

  test('the Scrolly Animation reaches its final Step without tweening', async ({ page }) => {
    await page.goto(SECTION_URL)
    await waitForScrolly(page)
    await gotoStep(page, 3)
    await expect(page.getByTestId('reaction-reading')).toHaveAttribute('data-step', '3')
    await gotoStep(page, 7)
    await expect(page.getByTestId('concentration-vessels')).toHaveAttribute('data-step', '3')
  })
})
