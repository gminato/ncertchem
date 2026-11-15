import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_47 = '/class-11/unit-4/4-7-molecular-orbital-theory'
const SECTION_49 = '/class-11/unit-4/4-9-hydrogen-bonding'
const TWEEN_WAIT_MS = 1200

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

/** Scrolls the Step with this index in the named Scrolly Animation into view. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      el.scrollIntoView({ block: el.closest('[data-layout="wide"]') ? 'end' : 'center' })
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

/** Each Scrolly Animation on the Section, with how many Steps it has. */
const SCROLLIES_47: [string, number][] = [
  ['mo-wave-combination', 5],
  ['mo-energy-orders', 6],
  ['mo-o2-filling', 5],
]
const SCROLLIES_49: [string, number][] = [
  ['hbond-contacts', 4],
  ['hbond-boiling', 4],
]

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 4.7 and 4.8 molecular orbitals (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('every Scrolly Step and the MO builder render, with no console errors', async ({ page }) => {
      test.setTimeout(240_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_47)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Molecular Orbital Theory')
      await waitForScrolly(page)

      for (const [animation, count] of SCROLLIES_47) {
        for (let i = 0; i < count; i++) {
          await gotoStep(page, animation, i)
          await page.waitForTimeout(TWEEN_WAIT_MS)
          await page.screenshot({ path: path.join(SCREEN_DIR, `u4-4-7-${animation}-step${i}-${scheme}.png`) })
        }
      }

      // MO builder: default state (O₂ with no electrons), then a changed state (B₂, all electrons placed).
      const sim = page.locator('[data-simulation="mo-builder"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(TWEEN_WAIT_MS)
      const live = sim.locator('[aria-live="polite"]')
      await expect(live).toContainText('O₂: 0 of 16 electrons placed')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-7-mo-builder-default-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Add an electron' }).click()
      await expect(live).toContainText('O₂: 1 of 16 electrons placed')

      await sim.getByRole('button', { name: /^B₂/ }).click()
      await sim.getByRole('button', { name: 'Fill all' }).click()
      await expect(live).toContainText('B₂: 10 of 10 electrons placed')
      await expect(live).toContainText('Paramagnetic, with 2 unpaired electrons')
      await page.waitForTimeout(TWEEN_WAIT_MS)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u4-4-7-mo-builder-changed-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })

  test.describe(`Unit 4.9 hydrogen bonding (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('every hydrogen-bonding Scrolly Step renders, with no console errors', async ({ page }) => {
      test.setTimeout(180_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_49)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hydrogen Bonding')
      await waitForScrolly(page)

      for (const [animation, count] of SCROLLIES_49) {
        for (let i = 0; i < count; i++) {
          await gotoStep(page, animation, i)
          await page.waitForTimeout(TWEEN_WAIT_MS)
          await page.screenshot({ path: path.join(SCREEN_DIR, `u4-4-9-${animation}-step${i}-${scheme}.png`) })
        }
      }

      expect(errors).toEqual([])
    })
  })
}
