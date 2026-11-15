import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_86 = '/class-11/unit-8/8-6-isomerism'
const ANIMATION = 'isomer-family'
const STEP_COUNT = 6

const DEFAULT_FRACTION = 0.4

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one. */
async function gotoStep(page: Page, index: number) {
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)).toHaveAttribute(
    'data-active',
    'true'
  )
}

/** Screenshots the visual of one Scrolly Step once its fade has finished. */
async function shotStep(page: Page, index: number, scheme: string) {
  await gotoStep(page, index)
  await page.waitForTimeout(1200)
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u8-8-6-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Section 8.6 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('isomer-family Scrolly and isomer explorer render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_86)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Isomerism')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(STEP_COUNT)

      // Chain isomers: all three rows of C5H12, with the names from the lib.
      await shotStep(page, 0, scheme)
      await expect(page.getByTestId('isomer-chain').first()).toBeVisible()
      await expect(page.getByTestId('isomer-chain').first()).toContainText('2,2-dimethylpropane')

      // Pairs: position, functional and metamers.
      for (let i = 1; i <= 3; i++) await shotStep(page, i, scheme)
      await gotoStep(page, 3)
      await expect(page.getByTestId('isomer-pair').first()).toHaveAttribute('data-relation', 'metamerism')

      // The 3D cis and trans pair.
      for (let i = 4; i < STEP_COUNT; i++) await shotStep(page, i, scheme)
      await gotoStep(page, 5)
      await expect(page.getByTestId('isomer-geometry').first()).toHaveAttribute('data-config', 'trans')

      // Explorer: default state (C7H16, no picks), two picks, and the C2H6O set with one pick.
      const sim = page.locator('[data-simulation="isomer-explorer"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('isomer-count')).toContainText('Counted by enumeration: 9 structural isomers')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-6-explorer-default-${scheme}.png`) })

      const cards = sim.locator('button[aria-pressed]').filter({ has: page.locator('svg') })
      await cards.nth(0).click()
      await cards.nth(1).click()
      await expect(sim.getByTestId('isomer-readout')).toContainText(' are ')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-6-explorer-pair-${scheme}.png`) })

      await sim.getByRole('button', { name: 'C₂H₆O', exact: true }).click()
      await expect(sim.getByTestId('isomer-count')).toContainText('All 2 saturated, acyclic isomers')
      await cards.nth(0).click()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-6-explorer-formula-${scheme}.png`) })

      await sim.getByRole('button', { name: 'C₄H₁₀O', exact: true }).click()
      await cards.nth(4).click()
      await cards.nth(5).click()
      await expect(sim.getByTestId('isomer-readout')).toContainText('metamers')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-6-explorer-metamer-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
