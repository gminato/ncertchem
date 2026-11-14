import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-2/2-6-filling-orbitals-electronic-configuration'
const SCREEN_DIR = path.join('test-results', 'screens')

/** The three Scrolly Animations in this Section, with their Step counts and wait times for tweens. */
const SCROLLIES = [
  { name: 'aufbau', animation: 'aufbau-diagonal', steps: 5, settle: [1800, 1800, 1800, 2400, 2400] },
  { name: 'build', animation: 'build-up-atoms', steps: 5, settle: [1000, 2000, 2000, 2000, 4200] },
  { name: 'exchange', animation: 'exchange-pairs', steps: 4, settle: [1000, 2600, 2600, 2600] },
] as const

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
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

/** Locates the Check card that ConfigBuilder renders for an element. */
function builder(page: Page, symbol: string) {
  return page.locator('[data-testid="config-builder"]').filter({ hasText: `(${symbol}, Z =` })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Filling orbitals Section (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1280, height: 800 } })

    test(`steps through every Scrolly Step with no console errors`, async ({ page }) => {
      test.setTimeout(150_000)
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Filling Orbitals and Electronic Configuration'
      )
      await expect(page.locator('[data-scrolly-step]')).toHaveCount(14)
      await waitForScrolly(page)

      for (const scrolly of SCROLLIES) {
        for (let i = 0; i < scrolly.steps; i++) {
          await gotoStep(page, scrolly.animation, i)
          await page.waitForTimeout(scrolly.settle[i])
          await page.screenshot({
            path: path.join(SCREEN_DIR, `u2-2-6-${scrolly.name}-step-${i}-${scheme}.png`),
          })
        }
        await expect(page.locator(`[data-animation="${scrolly.animation}"] [data-testid]`).first()).toBeVisible()
      }

      // Final states: the counter reaches 36, the build reaches chromium, the exchange counts reach 10 and 6.
      await expect(page.getByTestId('aufbau-diagonal').first()).toHaveAttribute('data-z', '36')
      await expect(page.getByTestId('build-up-atoms').first()).toHaveAttribute('data-placed', '24')
      await expect(page.getByTestId('exchange-energy').first()).toHaveAttribute('data-five', '10')
      await expect(page.getByTestId('exchange-energy').first()).toHaveAttribute('data-four', '6')

      expect(errors).toEqual([])
    })

    test(`ConfigBuilder renders, accepts clicks, and screenshots its states`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_URL)
      await waitForScrolly(page)

      const nitrogen = builder(page, 'N')
      await nitrogen.scrollIntoViewIfNeeded()
      await page.screenshot({ path: path.join(SCREEN_DIR, `u2-2-6-configbuilder-n-empty-${scheme}.png`) })

      // Pauli: two spin-up electrons in 1s. The third electron is refused.
      await nitrogen.getByText('Spin ↑', { exact: true }).click()
      const oneS = nitrogen.getByRole('button', { name: /^1s orbital 1 of 1/ })
      await oneS.click()
      await oneS.click()
      await oneS.click()
      await expect(nitrogen.getByText(/already holds two electrons/)).toBeVisible()
      await nitrogen.getByRole('button', { name: 'Check', exact: true }).click()
      await expect(nitrogen.getByRole('status')).toContainText('Pauli exclusion principle')
      await expect(nitrogen.locator('[data-subshell="1s"]')).toHaveAttribute('data-state', 'violation')
      await page.screenshot({ path: path.join(SCREEN_DIR, `u2-2-6-configbuilder-n-pauli-${scheme}.png`) })

      // Start again, then solve nitrogen from the keyboard alone.
      await nitrogen.getByRole('button', { name: 'Clear', exact: true }).click()
      await nitrogen.getByText('Auto', { exact: true }).click()
      await nitrogen.getByRole('button', { name: /^1s orbital 1 of 1/ }).focus()
      await page.keyboard.press('Space')
      await page.keyboard.press('Space')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Space')
      await page.keyboard.press('Space')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Space')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('Space')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('Space')
      await nitrogen.getByRole('button', { name: 'Check', exact: true }).click()
      await expect(nitrogen.getByRole('status')).toContainText('Correct.')
      await expect(nitrogen.getByRole('status')).toContainText('1s² 2s² 2p³')
      await page.screenshot({ path: path.join(SCREEN_DIR, `u2-2-6-configbuilder-n-correct-${scheme}.png`) })

      // Oxygen: the first 2p orbital is filled, then the fourth electron pairs, all with Auto.
      const oxygen = builder(page, 'O')
      await oxygen.scrollIntoViewIfNeeded()
      await oxygen.getByRole('button', { name: /^1s orbital 1 of 1/ }).click()
      await oxygen.getByRole('button', { name: /^1s orbital 1 of 1/ }).click()
      await oxygen.getByRole('button', { name: /^2s orbital 1 of 1/ }).click()
      await oxygen.getByRole('button', { name: /^2s orbital 1 of 1/ }).click()
      await oxygen.getByRole('button', { name: /^2p orbital 1 of 3/ }).click()
      await oxygen.getByRole('button', { name: /^2p orbital 2 of 3/ }).click()
      await oxygen.getByRole('button', { name: /^2p orbital 3 of 3/ }).click()
      await oxygen.getByRole('button', { name: /^2p orbital 1 of 3/ }).click()
      await oxygen.getByRole('button', { name: 'Check', exact: true }).click()
      await expect(oxygen.getByRole('status')).toContainText('Correct.')

      // Hund's rule: a 3d electron pairs up while another 3d orbital is still empty.
      // The counts are complete (Fe has 6 electrons in 3d), so Hund is the first rule named.
      const iron = builder(page, 'Fe')
      await iron.scrollIntoViewIfNeeded()
      const fill = async (label: string, orbital: number, times: number) => {
        for (let k = 0; k < times; k++) {
          await iron
            .getByRole('button', { name: new RegExp(`^${label} orbital ${orbital} of `) })
            .click()
        }
      }
      await fill('1s', 1, 2)
      await fill('2s', 1, 2)
      for (let o = 1; o <= 3; o++) await fill('2p', o, 2)
      await fill('3s', 1, 2)
      for (let o = 1; o <= 3; o++) await fill('3p', o, 2)
      await fill('4s', 1, 2)
      await fill('3d', 1, 2)
      await fill('3d', 2, 2)
      await fill('3d', 3, 1)
      await fill('3d', 4, 1)
      await iron.getByRole('button', { name: 'Check', exact: true }).click()
      await expect(iron.getByRole('status')).toContainText("Hund's rule broken in 3d")
      await expect(iron.locator('[data-subshell="3d"]')).toHaveAttribute('data-state', 'violation')
      await page.screenshot({ path: path.join(SCREEN_DIR, `u2-2-6-configbuilder-fe-hund-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}

test.describe('Filling orbitals Section (reduced motion)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('reaches the final Step of each Scrolly without tweening', async ({ page }) => {
    await page.goto(SECTION_URL)
    await waitForScrolly(page)
    await gotoStep(page, 'aufbau-diagonal', 4)
    await expect(page.getByTestId('aufbau-diagonal').first()).toHaveAttribute('data-z', '36')
    await gotoStep(page, 'build-up-atoms', 4)
    await expect(page.getByTestId('build-up-atoms').first()).toHaveAttribute('data-placed', '24')
    await gotoStep(page, 'exchange-pairs', 3)
    await expect(page.getByTestId('exchange-energy').first()).toHaveAttribute('data-four', '6')
  })
})
