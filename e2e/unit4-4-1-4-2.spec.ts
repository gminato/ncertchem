import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_41 = '/class-11/unit-4/4-1-kossel-lewis-approach'
const SECTION_42 = '/class-11/unit-4/4-2-ionic-bond'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

/** Scrolls the Step with this index in the named Scrolly Animation to the centre of the view. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      el.scrollIntoView({ block: 'center' })
    })
}

function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

const STEP_WAIT_MS = 1100

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 4 Sections 4.1 and 4.2 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('4.1 Scrollies and the Lewis builder, with no console errors', async ({ page }) => {
      test.setTimeout(150_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_41)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kössel–Lewis Approach to Chemical Bonding')
      await waitForScrolly(page)

      const scrollies: [string, string, number][] = [
        ['lewis-kossel-transfer', 'kossel', 4],
        ['lewis-octet-exceptions', 'octet', 4],
      ]
      for (const [animation, name, count] of scrollies) {
        for (let i = 0; i < count; i++) {
          await gotoStep(page, animation, i)
          await page.waitForTimeout(STEP_WAIT_MS)
          await page.screenshot({ path: path.join(SCREEN_DIR, `u4-4-1-${name}-step${i}-${scheme}.png`) })
        }
      }

      // The Lewis builder: default state (water), then a built state.
      const sim = page.locator('[data-simulation="lewis-builder"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('lewis-builder')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-1-builder-default-${scheme}.png`) })

      await sim.getByLabel('Valence electrons you count').fill('8')
      await expect(sim.getByTestId('electrons-total')).toHaveText('8')
      await sim.getByRole('button', { name: /Bond from 1\. O to 2\. H/ }).click()
      await sim.getByRole('button', { name: /Bond from 1\. O to 3\. H/ }).click()
      await expect(sim.getByTestId('electrons-left')).toHaveText('4')
      await sim.getByRole('button', { name: /Add a pair/ }).click()
      await sim.getByRole('button', { name: /Add a pair/ }).click()
      await expect(sim.getByTestId('electrons-left')).toHaveText('0')
      await expect(sim.getByTestId('builder-message')).toContainText('standard Lewis structure of H₂O')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-1-builder-built-${scheme}.png`) })

      expect(errors).toEqual([])
    })

    test('4.2 Born–Haber staircase, with no console errors', async ({ page }) => {
      test.setTimeout(120_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_42)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ionic or Electrovalent Bond')
      await waitForScrolly(page)

      for (let i = 0; i < 6; i++) {
        await gotoStep(page, 'lewis-born-haber', i)
        await page.waitForTimeout(i === 0 ? 400 : STEP_WAIT_MS + 400)
        await page.screenshot({ path: path.join(SCREEN_DIR, `u4-4-2-born-haber-step${i}-${scheme}.png`) })
      }
      await expect(page.getByTestId('born-haber-readout')).toContainText('−788')

      expect(errors).toEqual([])
    })
  })
}

test.describe('Lewis builder behaviour', () => {
  test('the Learner must count first, then the bonds and pairs unlock and the stage follows', async ({ page }) => {
    await page.goto(SECTION_41)
    await waitForScrolly(page)
    const sim = page.locator('[data-simulation="lewis-builder"]')
    await sim.scrollIntoViewIfNeeded()

    await expect(sim.getByTestId('builder-message')).toContainText('Count the valence electrons')
    await expect(sim.getByRole('button', { name: /Bond from 1\. O to 2\. H/ })).toBeDisabled()

    await sim.getByLabel('Valence electrons you count').fill('7')
    await expect(sim.getByRole('button', { name: /Bond from 1\. O to 2\. H/ })).toBeDisabled()

    await sim.getByLabel('Valence electrons you count').fill('8')
    await expect(sim.getByRole('button', { name: /Bond from 1\. O to 2\. H/ })).toBeEnabled()
    await expect(sim.getByTestId('builder-message')).toContainText('Draw a skeleton')
  })

  test('the species picker resets the builder and lists the curated structures', async ({ page }) => {
    await page.goto(SECTION_41)
    await waitForScrolly(page)
    const sim = page.locator('[data-simulation="lewis-builder"]')
    await sim.scrollIntoViewIfNeeded()

    await sim.getByLabel('Valence electrons you count').fill('8')
    await sim.getByRole('button', { name: /Bond from 1\. O to 2\. H/ }).click()
    await expect(sim.getByTestId('electrons-placed')).toHaveText('2')

    await sim.getByTestId('species-select').selectOption('CO2')
    await expect(sim.getByTestId('electrons-placed')).toHaveText('0')
    await expect(sim.getByTestId('electrons-total')).toHaveText('16')
    await expect(sim.locator('[data-testid="atom-chip"]')).toHaveCount(3)
  })
})
