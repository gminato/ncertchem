import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-5/5-2-applications-work-and-enthalpy'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one, then waits for the tween to finish. */
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

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1400)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u5-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 5, Section 5.2 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('every Scrolly Step and the P–V work lab render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Applications: Work and Enthalpy')

      // Piston: why w = −p_ex ΔV
      await waitForScrolly(page, 'work-piston')
      await expect(page.locator('[data-animation="work-piston"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'work-piston', i, '5-2-piston', scheme)
      await gotoStep(page, 'work-piston', 2)
      await expect(page.locator('[data-animation="work-piston"] [data-testid="piston-working"]')).toBeVisible()

      // One step, many steps and the reversible limit
      await waitForScrolly(page, 'work-paths')
      await expect(page.locator('[data-animation="work-paths"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'work-paths', i, '5-2-paths', scheme)
      await gotoStep(page, 'work-paths', 0)
      await expect(page.locator('[data-animation="work-paths"] [data-testid="paths-fraction"]')).toHaveText('72% of the reversible maximum')

      // ΔH against ΔU
      await waitForScrolly(page, 'work-enthalpy')
      await expect(page.locator('[data-animation="work-enthalpy"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'work-enthalpy', i, '5-2-enthalpy', scheme)

      // P–V work lab: default state, then compression in one step played to the end
      const lab = page.locator('[data-simulation="pv-work-lab"]')
      await lab.scrollIntoViewIfNeeded()
      await expect(lab.getByRole('img')).toBeVisible()
      await page.waitForTimeout(400)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u5-5-2-pv-lab-default-${scheme}.png`) })
      await expect(lab.getByTestId('work-fraction')).toContainText('92% of the reversible maximum')

      await lab.getByRole('radio', { name: '1', exact: true }).click()
      await lab.getByRole('radio', { name: 'Compression' }).click()
      await expect(lab.getByTestId('work-fraction')).toContainText('144% of the reversible minimum')
      // The lab only advances while it is on screen, so centre it before playing.
      await lab.evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await page.waitForTimeout(300)
      await lab.getByRole('button', { name: 'Play', exact: true }).click()
      await expect(lab.getByRole('button', { name: 'Play again' })).toBeVisible({ timeout: 20000 })
      await expect(lab.getByTestId('work-so-far')).toContainText('24.94 L bar (2494 J)')
      await page.waitForTimeout(400)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u5-5-2-pv-lab-compression-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}
