import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_74 = '/class-11/unit-7/7-4-redox-reactions-and-electrode-processes'
const TWEEN_WAIT_MS = 1000

function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

async function gotoStep(page: Page, animation: string, index: number) {
  const step = page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)
  await step.evaluate((el) => {
    el.scrollIntoView({ block: el.closest('[data-layout="wide"]') ? 'end' : 'center' })
  })
  await expect(step).toHaveAttribute('data-active', 'true')
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 7, Section 7.4 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Section 7.4: redox-daniell scrolly and electrode potential explorer render without errors', async ({
      page,
    }) => {
      test.setTimeout(180_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_74)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Redox Reactions and Electrode Processes')

      // 1. Scrolly Animation: redox-daniell (6 steps)
      await waitForScrolly(page, 'redox-daniell')
      const stepCount = 6
      await expect(page.locator('[data-animation="redox-daniell"] [data-scrolly-step]')).toHaveCount(stepCount)

      const scrollyPanel = page.locator('[data-animation="redox-daniell"] [data-testid="scrolly-visual"]')

      for (let i = 0; i < stepCount; i++) {
        await gotoStep(page, 'redox-daniell', i)
        await page.waitForTimeout(TWEEN_WAIT_MS)
        await scrollyPanel.screenshot({
          path: path.join(SCREEN_DIR, `u7-7-4-daniell-step${i}-${scheme}.png`),
        })
      }

      // 2. Simulation: electrode-potential-explorer
      const sim = page.locator('[data-simulation="electrode-potential-explorer"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(TWEEN_WAIT_MS)

      // Default state: Daniell cell (Zn | Cu)
      await expect(sim.getByTestId('cell-emf-readout')).toContainText('+1.10 V')
      await expect(sim.getByTestId('overall-reaction')).toContainText('Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)')
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-4-sim-default-${scheme}.png`),
      })

      // Changed state 1: Silver–Zinc cell (Zn | Ag)
      await sim.getByRole('button', { name: 'Silver–Zinc Cell (Zn | Ag)' }).click()
      await page.waitForTimeout(600)
      await expect(sim.getByTestId('cell-emf-readout')).toContainText('+1.56 V')
      await expect(sim.getByTestId('overall-reaction')).toContainText('Zn(s) + 2Ag⁺(aq) → Zn²⁺(aq) + 2Ag(s)')
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-4-sim-silver-zinc-${scheme}.png`),
      })

      // Changed state 2: Magnesium–Hydrogen cell (Mg | H₂)
      await sim.getByRole('button', { name: 'Magnesium–Hydrogen (Mg | H₂)' }).click()
      await page.waitForTimeout(600)
      await expect(sim.getByTestId('cell-emf-readout')).toContainText('+2.36 V')
      await expect(sim.getByTestId('overall-reaction')).toContainText('Mg(s) + 2H⁺(aq) → Mg²⁺(aq) + H₂(g)')
      await sim.screenshot({
        path: path.join(SCREEN_DIR, `u7-7-4-sim-mg-she-${scheme}.png`),
      })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
