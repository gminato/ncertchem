import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_83 = '/class-11/unit-8/8-3-structural-representations'
const ANIMATION = 'structure-morph'
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

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, index: number, scheme: string, what: string) {
  await gotoStep(page, index)
  await page.waitForTimeout(1500)
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u8-8-3-${what}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Section 8.3 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('structure-morph Scrolly and formula translator render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_83)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Structural Representations of Organic Compounds')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(STEP_COUNT)

      // Complete, condensed, bond-line (the morph), then a ring, a substituted benzene and wedge-dash.
      const names = ['complete', 'condensed', 'bondline', 'ring', 'arene', 'wedge']
      for (let i = 0; i < STEP_COUNT; i++) await shotStep(page, i, scheme, `step${i + 1}-${names[i]}`)
      await gotoStep(page, 0)
      await expect(page.getByTestId('structure-morph').first()).toHaveAttribute('data-kind', 'complete')
      await gotoStep(page, 1)
      await expect(page.getByTestId('morph-condensed')).toBeVisible()
      await gotoStep(page, 4)
      await expect(page.getByTestId('structure-morph').first()).toHaveAttribute('data-kind', 'arene')
      await expect(page.getByTestId('structure-morph').first()).toContainText('methylbenzene')

      // Translator: default state, one group picked, a typed molecule, and the quiz.
      const sim = page.locator('[data-simulation="formula-translator"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('translator-readout')).toContainText('4-methylpentan-2-ol')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-3-translator-default-${scheme}.png`) })

      await sim.getByRole('button', { name: /^Group 2,/ }).click()
      await expect(sim.getByTestId('translator-readout')).toContainText('1 group highlighted')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-3-translator-group-${scheme}.png`) })

      await sim.getByLabel('Or type a SMILES string').fill('CC(C)CC(C)C(C)O')
      await sim.getByRole('button', { name: 'Draw' }).click()
      await expect(sim.getByTestId('translator-readout')).toContainText('3,5-dimethylhexan-2-ol')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-3-translator-typed-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Quiz' }).click()
      const quiz = sim.locator('[data-testid="quiz-drawing"]')
      await expect(quiz).toBeVisible()
      await sim.getByRole('spinbutton', { name: 'Carbon atoms' }).fill('6')
      await sim.getByRole('spinbutton', { name: 'Hydrogen atoms' }).fill('14')
      await sim.getByRole('button', { name: 'Check' }).click()
      await expect(sim.getByTestId('quiz-feedback')).toContainText('Correct')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-3-translator-quiz-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
