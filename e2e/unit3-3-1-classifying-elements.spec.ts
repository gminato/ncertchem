import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-3/3-1-classifying-elements-and-genesis'

const ANIMATIONS = [
  { name: 'history-triads', steps: 4, label: 'triads' },
  { name: 'history-octaves', steps: 4, label: 'octaves' },
  { name: 'history-meyer', steps: 4, label: 'meyer' },
  { name: 'history-mendeleev-gaps', steps: 4, label: 'gaps' },
] as const

async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

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

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 3, Sections 3.1 and 3.2 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('Scrolly Steps, the Mendeleev Simulation and a clean console', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Why Classify Elements? The Genesis of the Periodic Table'
      )
      await waitForScrolly(page)

      for (const anim of ANIMATIONS) {
        for (let i = 0; i < anim.steps; i++) {
          await gotoStep(page, anim.name, i)
          await page.waitForTimeout(1100)
          await page.screenshot({ path: path.join(SCREEN_DIR, `u3-3-1-${anim.label}-step${i}-${scheme}.png`) })
        }
      }

      const sim = page.locator('[data-simulation="mendeleev-predict"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('predict-table')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u3-3-1-sim-default-${scheme}.png`) })

      await page.getByRole('button', { name: 'Reveal' }).click()
      await expect(page.getByTestId('results')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u3-3-1-sim-revealed-${scheme}.png`) })

      await page.getByText('Eka-silicon', { exact: true }).click()
      await expect(page.getByTestId('mendeleev-predict')).toHaveAttribute('data-target', 'silicon')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u3-3-1-sim-silicon-${scheme}.png`) })
      await page.getByRole('button', { name: 'Reveal' }).click()
      await expect(page.getByTestId('results')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u3-3-1-sim-silicon-revealed-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
