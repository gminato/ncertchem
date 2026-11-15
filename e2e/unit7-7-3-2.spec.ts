import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-7/7-3-2-balancing-of-redox-reactions'

/** Waits until hydration has run the Scrolly effects. */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one, then waits for the visual to update. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - 0.4 * window.innerHeight)
    })
  await expect(
    page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index),
  ).toHaveAttribute('data-active', 'true')
}

/** Screenshots the panel element of one Scrolly Step. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(900)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u7-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 7, Section 7.3.2 (${scheme})`, () => {
    test.use({
      colorScheme: scheme,
      viewport: { width: 1440, height: 900 },
    })

    test('every Scrolly Step and the Redox Balancer simulation render cleanly without console errors', async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Balancing of Redox Reactions')

      // Scrolly 1: Oxidation-Number Method (5 steps)
      await waitForScrolly(page, 'redox-balance-on')
      await expect(page.locator('[data-animation="redox-balance-on"] [data-scrolly-step]')).toHaveCount(5)
      for (let i = 0; i < 5; i++) {
        await shotStep(page, 'redox-balance-on', i, '7-3-2-on', scheme)
      }

      // Scrolly 2: Half-Reaction Method in Basic Medium (7 steps)
      await waitForScrolly(page, 'redox-balance-half')
      await expect(page.locator('[data-animation="redox-balance-half"] [data-scrolly-step]')).toHaveCount(7)
      for (let i = 0; i < 7; i++) {
        await shotStep(page, 'redox-balance-half', i, '7-3-2-half', scheme)
      }

      // Simulation: Redox Balancer
      const sim = page.locator('[data-simulation="redox-balancer"]')
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.getByTestId('sim-step-title')).toBeVisible()
      await page.waitForTimeout(500)

      // State 1: Default state (half-reaction method, permanganate + oxalate, step 1)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u7-7-3-2-sim-default-${scheme}.png`) })

      // State 2: Step 5 (electrons added to both halves)
      await sim.getByTestId('step-dot-4').click()
      await expect(sim.getByTestId('sim-step-title')).toContainText('Step 5 of 7')
      await page.waitForTimeout(900)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u7-7-3-2-sim-step5-${scheme}.png`) })

      // State 3: Oxidation-number method on the same skeleton, step 3
      await sim.getByRole('radio', { name: 'Oxidation number' }).click()
      await sim.getByTestId('step-dot-2').click()
      await expect(sim.getByTestId('sim-step-title')).toContainText('Step 3 of 5')
      await page.waitForTimeout(900)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u7-7-3-2-sim-on-step3-${scheme}.png`) })

      // State 4: Try It on a basic medium preset, answering at step 4 (electrons)
      await sim.getByRole('radio', { name: 'Half-reaction' }).click()
      await sim.getByTestId('preset-select').selectOption('chromium-hypochlorite')
      await sim.getByRole('radio', { name: 'Try it' }).click()
      for (let i = 0; i < 3; i++) {
        await sim.getByTestId('next-step-btn').click()
      }
      await expect(sim.getByTestId('sim-step-title')).toContainText('Step 4 of 7')
      await expect(sim.getByTestId('challenge-card')).toBeVisible()
      await page.waitForTimeout(500)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u7-7-3-2-sim-tryit-${scheme}.png`) })

      // A wrong answer gives specific feedback; a second wrong answer reveals the answer
      await sim.getByTestId('try-input-ox').fill('1')
      await sim.getByTestId('try-input-red').fill('1')
      await sim.getByTestId('try-input-ox').press('Enter')
      await expect(sim.getByTestId('feedback-wrong')).toBeVisible()
      await sim.getByTestId('try-input-ox').fill('2')
      await sim.getByTestId('try-input-ox').press('Enter')
      await expect(sim.getByTestId('feedback-revealed')).toBeVisible()
      await sim.getByTestId('continue-btn').click()
      await expect(sim.getByTestId('sim-step-title')).toContainText('Step 5 of 7')
      await page.waitForTimeout(900)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u7-7-3-2-sim-after-try-${scheme}.png`) })

      // The equation display never shows raw text
      // Only the visible KaTeX output counts (the hidden MathML annotation holds the source).
      const visible = await sim.getByTestId('sim-equation').locator('.katex-html').allInnerTexts()
      expect(visible.length).toBeGreaterThan(0)
      for (const text of visible) expect(text).not.toMatch(/->|\^|\|/)

      expect(errors).toEqual([])
    })
  })
}
