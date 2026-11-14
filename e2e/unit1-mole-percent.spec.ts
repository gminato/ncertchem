import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

const MOLE_URL = '/class-11/unit-1/1-8-mole-concept-and-molar-masses'
const PERCENT_URL = '/class-11/unit-1/1-9-percentage-composition'

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

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 1, Section 1.8 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('Scrolly Steps and the mole bridge render with no console errors', async ({ page }) => {
      const errors = collectErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(MOLE_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mole Concept and Molar Masses')
      await expect(page.locator('[data-scrolly-step]')).toHaveCount(5)
      await waitForScrolly(page)

      const stepNames = ['dozen', 'ream', 'scale', 'vessels', 'counts']
      for (let i = 0; i < 5; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(1000)
        await expect(page.getByTestId('mole-scale')).toHaveAttribute('data-step', String(i))
        await page.screenshot({
          path: path.join(SCREEN_DIR, `u1-1-8-step-${i}-${stepNames[i]}-${scheme}.png`),
        })
      }

      const bridge = page.locator('[data-simulation="mole-bridge"]')
      await bridge.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      await expect(page.getByTestId('mole-bridge-calc')).toContainText('36.04 g ÷ 18.02 g mol⁻¹ = 2.000 mol')
      await bridge.screenshot({ path: path.join(SCREEN_DIR, `u1-1-8-mole-bridge-default-${scheme}.png`) })

      // Changed state: carbon dioxide, then 1.0 × 10²⁴ particles
      await page.getByRole('radio').nth(1).click()
      await page.locator('#mole-bridge-particles').fill('10')
      await page.locator('#mole-bridge-particles').press('Enter')
      await page.waitForTimeout(1200)
      await expect(page.getByTestId('mole-bridge-calc')).toContainText('mol')
      await bridge.screenshot({ path: path.join(SCREEN_DIR, `u1-1-8-mole-bridge-changed-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })

  test.describe(`Unit 1, Section 1.9 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('empirical-formula pipeline Steps render with no console errors', async ({ page }) => {
      const errors = collectErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(PERCENT_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Percentage Composition')
      await expect(page.locator('[data-scrolly-step]')).toHaveCount(5)
      await waitForScrolly(page)

      const stepNames = ['percent', 'grams', 'moles', 'ratio', 'formulas']
      for (let i = 0; i < 5; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(1000)
        await expect(page.getByTestId('empirical-pipeline')).toHaveAttribute('data-step', String(i))
        await page.screenshot({
          path: path.join(SCREEN_DIR, `u1-1-9-step-${i}-${stepNames[i]}-${scheme}.png`),
        })
      }

      await expect(page.getByText('CH₂O').first()).toBeVisible()
      expect(errors).toEqual([])
    })
  })
}

test.describe('Unit 1 mole bridge behaviour', () => {
  test('an invalid formula shows a message and keeps the last valid substance', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(MOLE_URL)
    await waitForScrolly(page)

    const formula = page.getByTestId('mole-bridge-formula')
    await formula.fill('nacl')
    await expect(formula).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText(/Cannot read "nacl"/)).toBeVisible()
    await expect(page.getByTestId("mole-bridge")).toHaveAttribute(
      'data-formula',
      'H2O'
    )

    await formula.fill('Na2CO3')
    await expect(page.locator('[data-testid="mole-bridge"]')).toHaveAttribute('data-formula', 'Na2CO3')
    expect(errors).toEqual([])
  })

  test('editing the particle count updates mass and amount', async ({ page }) => {
    await page.goto(MOLE_URL)
    await waitForScrolly(page)

    // A full value in e-notation reaches any order of magnitude.
    await page.locator('#mole-bridge-particles').fill('6.022e23')
    await page.locator('#mole-bridge-particles').press('Enter')
    await expect(page.getByTestId('mole-bridge-calc')).toContainText('1.000 mol')
    await expect(page.locator('#mole-bridge-mass')).toHaveValue('18.02')

    // A bare mantissa is scaled by the exponent the field shows (now × 10²³).
    await page.locator('#mole-bridge-mass').focus()
    await page.locator('#mole-bridge-particles').fill('3.011')
    await page.locator('#mole-bridge-particles').press('Enter')
    await expect(page.getByTestId('mole-bridge-calc')).toContainText('0.5000 mol')
  })
})
