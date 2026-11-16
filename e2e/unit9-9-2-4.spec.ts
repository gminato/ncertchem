import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-2-4-conformations'
const ANIMATION = 'ethane-rotation'
const SIM = 'newman-rotor'
const STEP_NAMES = ['staggered-3d', 'turning-3d', 'sawhorse', 'newman', 'energy'] as const
const DEFAULT_FRACTION = 0.4

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one. */
async function gotoStep(page: Page, index: number) {
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.2.4 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly Steps and the Newman rotor render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Conformations of Alkanes')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(5)
      for (let i = 0; i < 5; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(1800)
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-4-${STEP_NAMES[i]}-${scheme}.png`) })
      }

      // Simulation, default state: staggered ethane (60°). Text sizes and drawing sizes are checked in CSS pixels.
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(600)
      const small = await sim.evaluate((root) =>
        [...root.querySelectorAll('figcaption, p, label, output, button, span')]
          .filter((el) => el.textContent && el.textContent.trim().length > 0 && !el.closest('header'))
          .map((el) => ({ text: el.textContent!.trim().slice(0, 40), size: parseFloat(getComputedStyle(el).fontSize) }))
          .filter((x) => x.size < 14)
      )
      expect(small, JSON.stringify(small)).toEqual([])
      const readoutSize = await sim.getByTestId('rotor-readout').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
      expect(readoutSize).toBeGreaterThanOrEqual(16)
      const rim = await sim.getByTestId('newman-dial').locator('circle').first().boundingBox()
      expect(rim!.width).toBeGreaterThanOrEqual(140)
      // Rendered H label size: font size times the drawing's scale (rendered width over viewBox width).
      const labelPx = await sim.getByTestId('newman-dial').evaluate((el) => {
        const svg = el as unknown as SVGSVGElement
        const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
        const t = svg.querySelector('text')!
        return parseFloat(t.getAttribute('font-size') ?? '0') * scale
      })
      expect(labelPx).toBeGreaterThanOrEqual(15)
      await expect(sim.getByTestId('rotor-readout')).toContainText('θ = 60°, staggered')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-4-newman-rotor-default-${scheme}.png`) })

      // Changed state 1: the Home key turns the back carbon to the eclipsed form.
      await sim.getByTestId('newman-dial').focus()
      await page.keyboard.press('Home')
      await expect(sim.getByTestId('rotor-readout')).toContainText('θ = 0°, eclipsed')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-4-newman-rotor-eclipsed-${scheme}.png`) })

      // Changed state 2: a skew angle of 30°, and the temperature at 1000 K.
      await sim.getByLabel('Dihedral angle θ').focus()
      for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowRight')
      await expect(sim.getByTestId('rotor-readout')).toContainText('θ = 30°, skew')
      await sim.getByLabel('Temperature').focus()
      await page.keyboard.press('End')
      await expect(sim.getByTestId('rotor-temperature')).toContainText('81.8 %')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-4-newman-rotor-skew-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
