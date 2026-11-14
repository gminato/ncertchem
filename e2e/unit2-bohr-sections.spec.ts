import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_24 = '/class-11/unit-2/2-4-bohr-model'
const SECTION_25 = '/class-11/unit-2/2-5-towards-quantum-mechanical-model'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

/** Scrolls the Step with this index in the named Scrolly Animation to the centre of the view. */
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

const DEFAULT_TIMEOUT_MS = 1500
const JUMP_WAIT_MS = 2600

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 2 Bohr sections (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('2.4 Scrolly steps and the hydrogen spectrum Simulation, with no console errors', async ({ page }) => {
      test.setTimeout(120_000)
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_24)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText("Bohr's Model for Hydrogen Atom")
      await waitForScrolly(page)

      // The four Steps of the pilot Scrolly.
      for (let i = 0; i < 4; i++) {
        await gotoStep(page, 'bohr-emission', i)
        await page.waitForTimeout(i === 2 ? 2200 : DEFAULT_TIMEOUT_MS)
        await page.screenshot({ path: path.join(SCREEN_DIR, `u2-2-4-scrolly-step${i}-${scheme}.png`) })
      }

      // The flagship Simulation: default state, then a changed state.
      const sim = page.getByTestId('hydrogen-spectrum')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.locator('[data-testid="rung-3"]')).toBeVisible()
      await page.screenshot({ path: path.join(SCREEN_DIR, `u2-2-4-sim-default-${scheme}.png`) })

      // Build a series: 3 to 1, 4 to 1, then Balmer 4 to 2, 5 to 2, 6 to 2, then 6 to 3 (Paschen).
      for (const level of [1, 4, 2, 5, 6, 3]) {
        await sim.locator(`[data-testid="hit-${level}"]`).click()
        await page.waitForTimeout(JUMP_WAIT_MS)
      }
      await expect(sim.getByTestId('spectral-line')).toHaveCount(6)
      await page.getByRole('switch', { name: 'Show series' }).click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(SCREEN_DIR, `u2-2-4-sim-changed-${scheme}.png`) })
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u2-2-4-sim-full-${scheme}.png`) })

      await page.getByRole('switch', { name: 'Absorption mode' }).click()
      await sim.locator('[data-testid="hit-1"]').click()
      await page.waitForTimeout(JUMP_WAIT_MS)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u2-2-4-sim-absorption-${scheme}.png`) })

      expect(errors).toEqual([])
    })

    test('2.5 Scrolly steps (de Broglie scale, de Broglie orbit, Heisenberg), with no console errors', async ({ page }) => {
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_25)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Towards Quantum Mechanical Model of the Atom'
      )
      await waitForScrolly(page)

      const names = ['scale', 'orbit', 'heisenberg']
      const animations = ['de-broglie-scale', 'de-broglie-orbit', 'heisenberg-microscope']
      const counts = [4, 5, 4]
      for (let s = 0; s < names.length; s++) {
        for (let i = 0; i < counts[s]; i++) {
          await gotoStep(page, animations[s], i)
          await page.waitForTimeout(1200)
          await page.screenshot({ path: path.join(SCREEN_DIR, `u2-2-5-${names[s]}-step${i}-${scheme}.png`) })
        }
      }

      expect(errors).toEqual([])
    })
  })
}

test.describe('hydrogen spectrum Simulation behaviour', () => {
  test('clicking levels builds the series, and the readout matches the transition', async ({ page }) => {
    await page.goto(SECTION_24)
    await waitForScrolly(page)
    const sim = page.getByTestId('hydrogen-spectrum')
    await sim.scrollIntoViewIfNeeded()

    // Start at 3 to 2 (no line yet). Clicking level 1 makes the transition 3 to 1: a Lyman line.
    await expect(sim.getByTestId('spectral-line')).toHaveCount(0)
    await sim.locator('[data-testid="hit-1"]').click()
    await expect(sim.getByTestId('hydrogen-strip')).toHaveAttribute('data-mode', 'emission')
    await page.waitForTimeout(JUMP_WAIT_MS)
    await expect(sim.getByTestId('spectral-line')).toHaveCount(1)
    await expect(sim.locator('dl')).toContainText('102.6 nm')
    await expect(sim.locator('dl')).toContainText('Lyman')

    // Random transitions add lines, and the readout always names a series.
    await page.getByRole('button', { name: 'Random transition' }).click()
    await page.waitForTimeout(JUMP_WAIT_MS)
    await expect(sim.locator('dl')).toContainText('Series')
  })

  test('the series brackets appear when Show series is on', async ({ page }) => {
    await page.goto(SECTION_24)
    await waitForScrolly(page)
    const sim = page.getByTestId('hydrogen-spectrum')
    await sim.scrollIntoViewIfNeeded()

    await sim.locator('[data-testid="hit-1"]').click()
    await page.waitForTimeout(JUMP_WAIT_MS)
    await page.getByRole('switch', { name: 'Show series' }).click()
    await expect(sim.getByTestId('series-bracket').first()).toBeVisible()
  })

  test('absorption mode darkens the line instead of lighting it', async ({ page }) => {
    await page.goto(SECTION_24)
    await waitForScrolly(page)
    const sim = page.getByTestId('hydrogen-spectrum')
    await sim.scrollIntoViewIfNeeded()

    await page.getByRole('switch', { name: 'Absorption mode' }).click()
    await expect(sim).toHaveAttribute('data-mode', 'absorption')
    await sim.locator('[data-testid="hit-1"]').click()
    await page.waitForTimeout(JUMP_WAIT_MS)
    await expect(sim.getByTestId('spectral-line')).toHaveCount(1)
    await expect(sim.getByTestId('hydrogen-strip')).toHaveAttribute('data-mode', 'absorption')
    await expect(sim.locator('dl')).toContainText('absorption')
  })

  test('keyboard: Enter on a focused level selects it and starts a transition', async ({ page }) => {
    await page.goto(SECTION_24)
    await waitForScrolly(page)
    const sim = page.getByTestId('hydrogen-spectrum')
    await sim.scrollIntoViewIfNeeded()

    await sim.locator('[data-testid="rung-1"]').focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(JUMP_WAIT_MS)
    await expect(sim.getByTestId('spectral-line')).toHaveCount(1)
  })

  test('reduced motion: the line appears at once, with no jump to wait for', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(SECTION_24)
    await waitForScrolly(page)
    const sim = page.getByTestId('hydrogen-spectrum')
    await sim.scrollIntoViewIfNeeded()

    await sim.locator('[data-testid="hit-1"]').click()
    await expect(sim.getByTestId('spectral-line')).toHaveCount(1)
  })
})
