import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-8/8-7-1-reaction-mechanisms'
const SCROLLY = 'bond-fission'
const SIM = '[data-simulation="arrow-pusher"]'
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
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)).toHaveAttribute(
    'data-active',
    'true',
  )
}

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1800)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-1-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Section 8.7 part 1 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('section renders, every Step and the arrow-pusher states are captured, with no console errors', async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Reaction Mechanisms: Bond Fission, Intermediates and Reagents',
      )

      // Scrolly: six Steps, each captured.
      await waitForScrolly(page, SCROLLY)
      await expect(page.locator(`[data-animation="${SCROLLY}"] [data-scrolly-step]`)).toHaveCount(6)
      for (let i = 0; i < 6; i++) await shotStep(page, SCROLLY, i, 'fission', scheme)

      // Arrow-pusher, default state.
      const sim = page.locator(SIM)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('arrow-stage')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-1-arrow-default-${scheme}.png`) })

      // Changed state 1: a wrong head for a cleavage into ions gets the lib's reason.
      await sim.getByRole('button', { name: 'C–Br bond', exact: true }).click()
      await sim.getByRole('button', { name: 'Br (atom 4)', exact: true }).click()
      await sim.getByRole('radio', { name: 'Half head: one electron' }).click()
      await sim.getByRole('button', { name: 'Place arrow', exact: true }).click()
      await expect(sim.getByTestId('arrow-readout')).toContainText('full head')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-1-arrow-wrong-head-${scheme}.png`) })

      // Changed state 2: the correct full-headed arrow completes the step and shows the products.
      await sim.getByRole('radio', { name: 'Full head: a pair' }).click()
      await sim.getByRole('button', { name: 'Place arrow', exact: true }).click()
      await expect(sim.getByTestId('arrow-outcome')).toContainText('Br⁻')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-1-arrow-heterolysis-${scheme}.png`) })

      // Changed state 3: a nucleophile attack, with the product drawn.
      await sim.getByRole('button', { name: 'Next step', exact: true }).click()
      await sim.getByRole('button', { name: 'Next step', exact: true }).click()
      await sim.getByRole('button', { name: 'Next step', exact: true }).click()
      await sim.getByRole('button', { name: 'Next step', exact: true }).click()
      await sim.getByRole('button', { name: 'Next step', exact: true }).click()
      await sim.getByRole('button', { name: 'Next step', exact: true }).click()
      await sim.getByRole('button', { name: 'Next step', exact: true }).click()
      await expect(sim.getByText('Step 8 of 8')).toBeVisible()
      await sim.getByRole('button', { name: 'Show the arrows', exact: true }).click()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-1-arrow-attack-answer-${scheme}.png`) })

      // Ranking game: order the carbocations and check the lib's order.
      const rank = sim.getByTestId('rank-game')
      await rank.scrollIntoViewIfNeeded()
      await rank.getByRole('button', { name: 'CH₃C⁺(CH₃)CH₃', exact: true }).click()
      await rank.getByRole('button', { name: 'CH₃CH⁺CH₃', exact: true }).click()
      await rank.getByRole('button', { name: 'CH₃CH₂⁺', exact: true }).click()
      await rank.getByRole('button', { name: 'CH₃⁺', exact: true }).click()
      await rank.getByRole('button', { name: 'Check the order', exact: true }).click()
      await expect(rank.getByTestId('rank-readout')).toContainText('Correct.')
      await rank.screenshot({ path: path.join(SCREEN_DIR, `u8-8-7-1-rank-checked-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
