import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-3-alkenes-structure-isomerism'
const ANIMATION = 'double-bond'
const SIM = '[data-simulation="cis-trans-checker"]'
const STEP_COUNT = 6

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one, then waits for the visual to settle. */
async function gotoStep(page: Page, index: number) {
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - 0.4 * window.innerHeight)
    })
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
  await expect(page.locator(`[data-animation="${ANIMATION}"] svg`)).toHaveAttribute('data-step', String(index))
  await page.waitForTimeout(900)
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.3 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('every Scrolly Step and the cis-trans checker render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alkenes: Structure, Nomenclature and Isomerism')

      await waitForScrolly(page)
      const steps = page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
      await expect(steps).toHaveCount(STEP_COUNT)
      for (let i = 0; i < STEP_COUNT; i++) {
        await gotoStep(page, i)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-step${i}-${scheme}.png`) })
      }

      // The cis-trans checker: default (but-2-ene), then predicted, then a like pair and a second alkene.
      const sim = page.locator(SIM)
      await sim.evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await sim.getByRole('button', { name: 'Only one' }).click()
      await expect(sim.getByTestId('cis-trans-verdict')).toHaveAttribute('data-correct', 'no')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-sim-default-${scheme}.png`) })

      // Readability: every drawing label renders at 14 px or more, and isomer names at 16 px or more.
      const sizes = await sim.getByTestId('cis-trans-drawing').evaluate((svg) => {
        const box = svg.getBoundingClientRect()
        const scale = box.width / (svg as SVGSVGElement).viewBox.baseVal.width
        return [...svg.querySelectorAll('text')].map((t) => ({
          text: t.textContent ?? '',
          px: parseFloat(getComputedStyle(t).fontSize) * scale,
        }))
      })
      for (const t of sizes) expect(t.px, t.text).toBeGreaterThanOrEqual(14)
      for (const t of sizes.filter((x) => x.text.startsWith('cis-') || x.text.startsWith('trans-') || x.text.startsWith('One arrangement'))) {
        expect(t.px, t.text).toBeGreaterThanOrEqual(16)
      }

      await sim.getByRole('button', { name: 'Two', exact: true }).click()
      await expect(sim.getByTestId('cis-trans-live')).toContainText('cis-but-2-ene')
      await expect(sim.getByTestId('cis-trans-live')).toContainText('trans-but-2-ene')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-sim-butene-${scheme}.png`) })

      await sim.getByRole('button', { name: '2-Methylpropene' }).click()
      await sim.getByRole('button', { name: 'Only one' }).click()
      await expect(sim.getByTestId('cis-trans-verdict')).toHaveAttribute('data-correct', 'yes')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-sim-methylpropene-${scheme}.png`) })

      await sim.getByRole('button', { name: '1,2-Dichloroethene' }).click()
      await sim.getByRole('button', { name: 'Two', exact: true }).click()
      await expect(sim.getByTestId('cis-trans-live')).toContainText('cis-1,2-dichloroethene')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-sim-dichloroethene-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
