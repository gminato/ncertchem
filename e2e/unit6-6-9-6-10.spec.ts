import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_69 = '/class-11/unit-6/6-9-ionic-equilibrium-in-solution'
const SECTION_610 = '/class-11/unit-6/6-10-acids-bases-and-salts'
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
  await expect(
    page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)
  ).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1500)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u6-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6, Sections 6.9 and 6.10 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('6.9 page: electrolyte Scrolly renders with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_69)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ionic Equilibrium in Solution')

      await waitForScrolly(page, 'ionic-electrolytes')
      await expect(page.locator('[data-animation="ionic-electrolytes"] [data-scrolly-step]')).toHaveCount(3)
      for (let i = 0; i < 3; i++) await shotStep(page, 'ionic-electrolytes', i, '6-9-electrolytes', scheme)

      expect(errors, errors.join('\n')).toEqual([])
    })

    test('6.10 page: acid-base Scrolly and conjugate-pair sorter render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_610)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Acids, Bases and Salts')

      await waitForScrolly(page, 'acid-base-concepts')
      await expect(page.locator('[data-animation="acid-base-concepts"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'acid-base-concepts', i, '6-10-acidbase', scheme)

      const sim = page.locator('[data-simulation="conjugate-pair-sorter"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('progress')).toHaveText('Card 1 of 12')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-10-sorter-default-${scheme}.png`) })

      // Changed state 1: card 1 (HCl and water) answered with every role right.
      await sim.getByRole('button', { name: 'Brønsted acid: HCl' }).click()
      await sim.getByRole('button', { name: 'Brønsted base: H₂O' }).click()
      await sim.getByRole('button', { name: 'Conjugate acid: H₃O⁺' }).click()
      await sim.getByRole('button', { name: 'Conjugate base: Cl⁻' }).click()
      await sim.getByRole('button', { name: 'Check card' }).click()
      await expect(sim.getByTestId('summary')).toContainText('All roles right')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-10-sorter-right-${scheme}.png`) })

      // Changed state 2: card 2 (NH3 and water) with the first chip in every role, so the feedback marks wrong roles.
      await sim.getByRole('button', { name: 'Next card' }).click()
      await expect(sim.getByTestId('progress')).toHaveText('Card 2 of 12')
      await sim.getByRole('button', { name: 'Brønsted acid: NH₃' }).click()
      await sim.getByRole('button', { name: 'Brønsted base: NH₃' }).click()
      await sim.getByRole('button', { name: 'Conjugate acid: NH₃' }).click()
      await sim.getByRole('button', { name: 'Conjugate base: NH₃' }).click()
      await sim.getByRole('button', { name: 'Check card' }).click()
      await expect(sim.getByTestId('feedback')).toContainText('Not every role is right')
      await expect(sim.getByTestId('score')).toHaveText('Right so far: 1 of 2')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u6-6-10-sorter-wrong-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
