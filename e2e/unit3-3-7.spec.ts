import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION = '/class-11/unit-3/3-7-chemical-properties-and-reactivity'
const SCREEN_DIR = path.join('test-results', 'screens')
const STEP_COUNT = 3

async function gotoStep(page: Page, index: number) {
  const step = page.locator('[data-scrolly-step]').nth(index)
  // Put the Step near the top of the viewport so it passes the activation line.
  await step.evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
  })
  await expect(step).toHaveAttribute('data-active', 'true')
  // Let the view tween finish before the screenshot.
  await page.waitForTimeout(1500)
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Section 3.7 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly steps, the Oxide Lab and checks render with a clean console', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const scrolly = page.locator('[data-animation="chemical-properties"]')
      await expect(scrolly).toBeVisible()
      await expect(scrolly.locator('[data-scrolly-step]')).toHaveCount(STEP_COUNT)

      const names = ['oxides', 'diagonal', 'extremes']
      for (let i = 0; i < STEP_COUNT; i++) {
        await gotoStep(page, i)
        await scrolly.locator('[data-testid="scrolly-visual"]').screenshot({
          path: path.join(SCREEN_DIR, `u3-3-7-step${i + 1}-${names[i]}-${scheme}.png`),
        })
      }

      const sim = page.locator('[data-simulation="oxide-lab"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(1200)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-oxide-lab-default-${scheme}.png`) })

      await sim.getByRole('button', { name: /Al₂O₃/ }).click()
      await expect(sim.getByRole('button', { name: /Al₂O₃/ })).toHaveAttribute('aria-pressed', 'true')
      // Let the acid and base solids finish dissolving (about 3.3 s after the change).
      await page.waitForTimeout(3800)
      const opacities = await sim.locator('[data-solid]').evaluateAll((nodes) =>
        nodes.map((n) => Number(getComputedStyle(n).opacity))
      )
      // Order: dilute HCl, water, NaOH. Water keeps the solid intact.
      expect(opacities[0]).toBeLessThan(0.05)
      expect(opacities[1]).toBeGreaterThan(0.95)
      expect(opacities[2]).toBeLessThan(0.05)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-oxide-lab-alumina-${scheme}.png`) })

      await sim.getByRole('button', { name: /Cl₂O₇/ }).click()
      await page.waitForTimeout(1500)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u3-3-7-oxide-lab-cl2o7-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}

test('Oxide Lab reports its state in a live region and keeps the equations balanced text', async ({ page }) => {
  await page.goto(SECTION)
  const sim = page.locator('[data-simulation="oxide-lab"]')
  await sim.scrollIntoViewIfNeeded()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Na₂O')
  await sim.getByRole('button', { name: /SO₃/ }).click()
  await expect(sim.locator('[aria-live="polite"]')).toContainText('SO₃')
  await expect(sim.locator('[aria-live="polite"]')).toContainText('Illustrative pH colour')
  await expect(sim.locator('.katex').first()).toBeVisible()
})
