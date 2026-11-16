import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-2-2-preparation-of-alkanes'
const ANIMATION = 'alkane-routes'
const SIM = '[data-simulation="alkane-synthesis-planner"]'

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
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-testid="routes-visual"]`)).toHaveAttribute('data-step', String(index))
  await page.waitForTimeout(900)
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.2.2 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('every Scrolly Step and the synthesis planner render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Preparation of Alkanes')

      // The routes Scrolly: six Steps, four schemes and Kolbe's cell.
      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(6)
      for (let i = 0; i < 6; i++) {
        await gotoStep(page, i)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-2-routes-step${i}-${scheme}.png`) })
      }
      await gotoStep(page, 3)
      await expect(page.getByTestId('routes-arithmetic')).toContainText('1 + 1 = 2')
      await expect(page.getByTestId('routes-names')).toContainText('ethane, pentane, octane')
      await gotoStep(page, 5)
      await expect(page.getByTestId('routes-title')).toHaveText("Kolbe's electrolytic method")

      // The planner: the default state (a mixture), then a decarboxylation and the methane question.
      const sim = page.locator(SIM)
      await sim.evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await expect(sim.getByTestId('planner-verdict')).toHaveText('Gives pentane, but only as one of 3 products.')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-2-planner-default-${scheme}.png`) })

      await sim.getByTestId('planner-route').selectOption('decarboxylate')
      await sim.getByTestId('planner-target').selectOption('propane')
      await sim.getByTestId('planner-a').selectOption('butanoic')
      await expect(sim.getByTestId('planner-verdict')).toHaveText('Gives propane, and nothing else.')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-2-planner-decarboxylate-${scheme}.png`) })

      await sim.getByTestId('planner-route').selectOption('kolbe')
      await sim.getByTestId('planner-target').selectOption('methane')
      await sim.getByTestId('planner-a').selectOption('methanoic')
      await expect(sim.getByTestId('planner-verdict')).toContainText('methane cannot be made this way')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-2-planner-kolbe-methane-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
