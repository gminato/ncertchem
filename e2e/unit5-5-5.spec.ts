import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-5/5-5-enthalpies-for-different-types-of-reactions'
const SCREEN_DIR = path.join('test-results', 'screens')
const SIM = '[data-simulation="bond-energy-ledger"]'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).first()).toHaveAttribute('data-active', 'true')
}

async function gotoStep(page: Page, animation: string, index: number) {
  await page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index).evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`5.5 Enthalpies for different types of reactions (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Born–Haber and dissolution Scrollies and the bond ledger render without console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_URL)

      // Born–Haber: six Steps, each shows the diagram and readout.
      await waitForScrolly(page, 'unit5-nacl-born-haber')
      const born = page.locator('[data-animation="unit5-nacl-born-haber"]')
      for (let i = 0; i < 6; i++) {
        await gotoStep(page, 'unit5-nacl-born-haber', i)
        await expect(born.locator('[data-testid="nacl-born-haber"]')).toHaveAttribute('data-step', String(i))
        await page.waitForTimeout(300)
        await born.screenshot({ path: path.join(SCREEN_DIR, `u5-5.5-bornhaber-step${i}-${scheme}.png`) })
      }

      // Dissolution: four Steps.
      await waitForScrolly(page, 'unit5-nacl-dissolution')
      const dissolution = page.locator('[data-animation="unit5-nacl-dissolution"]')
      for (let i = 0; i < 4; i++) {
        await gotoStep(page, 'unit5-nacl-dissolution', i)
        await expect(dissolution.locator('[data-testid="nacl-dissolution"]')).toHaveAttribute('data-step', String(i))
        await page.waitForTimeout(300)
        await dissolution.screenshot({ path: path.join(SCREEN_DIR, `u5-5.5-dissolution-step${i}-${scheme}.png`) })
      }

      // Bond ledger: default state, then a changed reaction at a partial step.
      const sim = page.locator(SIM)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.locator('[data-testid="ledger-stage"]')).toBeVisible()
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5.5-bondledger-default-${scheme}.png`) })

      await sim.getByRole('radio', { name: 'H₂ + Cl₂' }).click()
      await sim.getByRole('slider', { name: 'Bond changes' }).fill('3')
      await expect(sim.locator('[data-testid="ledger-result"]')).toContainText('so far')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u5-5.5-bondledger-changed-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
