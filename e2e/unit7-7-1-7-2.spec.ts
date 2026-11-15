import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_7_1 = '/class-11/unit-7/7-1-classical-idea-of-redox-reactions'
const SECTION_7_2 = '/class-11/unit-7/7-2-redox-reactions-in-terms-of-electron-transfer'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one, then waits for the step attribute. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - 0.4 * window.innerHeight)
    })
  await expect(
    page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)
  ).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual panel element of one Scrolly Step. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1000)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u7-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 7, Sections 7.1 and 7.2 (${scheme})`, () => {
    test.use({
      colorScheme: scheme,
      viewport: { width: 1440, height: 900 },
    })

    test('Section 7.1: classical redox Scrolly renders cleanly with zero console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_7_1)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Classical Idea of Redox Reactions')

      // Scrolly: redox-classical (5 steps)
      await waitForScrolly(page, 'redox-classical')
      await expect(page.locator('[data-animation="redox-classical"] [data-scrolly-step]')).toHaveCount(5)

      for (let i = 0; i < 5; i++) {
        await shotStep(page, 'redox-classical', i, '7-1-classical', scheme)
      }

      expect(errors).toEqual([])
    })

    test('Section 7.2: electron-transfer Scrolly and Metal Displacement Lab render cleanly with zero console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_7_2)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Redox Reactions in Terms of Electron Transfer')

      // Scrolly: redox-electron-transfer (5 steps)
      await waitForScrolly(page, 'redox-electron-transfer')
      await expect(page.locator('[data-animation="redox-electron-transfer"] [data-scrolly-step]')).toHaveCount(5)

      for (let i = 0; i < 5; i++) {
        await shotStep(page, 'redox-electron-transfer', i, '7-2-transfer', scheme)
      }

      // Simulation: Metal Displacement Lab
      const lab = page.locator('[data-simulation="metal-displacement-lab"]')
      await lab.scrollIntoViewIfNeeded()
      await expect(lab.getByRole('img')).toBeVisible()
      await page.waitForTimeout(400)

      // 1. Default state (undipped Zn in Cu²⁺)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u7-7-2-sim-default-${scheme}.png`) })
      await expect(lab.getByTestId('readout-metal')).toContainText('Zn')
      await expect(lab.getByTestId('readout-ion')).toContainText('Cu²⁺')
      await expect(lab.getByTestId('readout-emf')).toContainText('+1.10 V')
      await expect(lab.getByTestId('readout-outcome')).toContainText('Displacement Spontaneous')

      // 2. Changed State 1: Dip strip (Zn in Cu²⁺ active displacement)
      await lab.evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await page.waitForTimeout(200)
      await lab.getByTestId('dip-button').click()
      await page.waitForTimeout(2500)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u7-7-2-sim-zn-cu-dipped-${scheme}.png`) })

      // 3. Changed State 2: Cu strip in Zn²⁺ (non-spontaneous, no visible reaction)
      await lab.getByRole('radio', { name: 'Cu', exact: true }).click()
      await lab.getByRole('radio', { name: 'Zn²⁺', exact: true }).click()
      await expect(lab.getByTestId('readout-emf')).toContainText('−1.10 V')
      await expect(lab.getByTestId('readout-outcome')).toContainText('No Visible Reaction')
      await lab.getByTestId('dip-button').click()
      await page.waitForTimeout(500)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u7-7-2-sim-cu-zn-noreaction-${scheme}.png`) })

      // 4. Changed State 3: Co in Ni²⁺ (NCERT §7.2.1 moderate equilibrium case)
      await lab.getByTestId('co-ni-toggle').click()
      await expect(lab.getByTestId('readout-metal')).toContainText('Co')
      await expect(lab.getByTestId('readout-ion')).toContainText('Ni²⁺')
      await expect(lab.getByTestId('readout-emf')).toContainText('+0.03 V')
      await expect(lab.getByTestId('readout-outcome')).toContainText('Moderate Both Ways')
      await expect(lab.getByTestId('co-ni-footnote')).toBeVisible()
      await lab.getByTestId('dip-button').click()
      await page.waitForTimeout(2500)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u7-7-2-sim-co-ni-dipped-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
