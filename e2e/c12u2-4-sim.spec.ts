import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SIM = 'e-g-k-converter'
const SCREEN_DIR = path.join(process.cwd(), 'test-results', 'screens')
fs.mkdirSync(SCREEN_DIR, { recursive: true })

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Local `next start` does not serve Vercel's hosted `/_vercel/insights/script.js` endpoint.
      if (text.includes('Failed to load resource: the server responded with a status of 404')) return
      errors.push(text)
    }
  })
  return errors
}

async function selectReaction(page: Page, label: string) {
  await page.getByLabel('Reaction', { exact: true }).selectOption({ label })
}

test.describe('E°, ΔG° and K Converter', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test.describe(scheme, () => {
      test.use({ colorScheme: scheme })

      test(`default and changed states render (${scheme})`, async ({ page }) => {
        const errors = watchErrors(page)
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto(`/dev/sim/${SIM}`)
        const sim = page.locator(`[data-simulation="${SIM}"]`)
        await sim.scrollIntoViewIfNeeded()
        await expect(sim.getByText('Cathode (reduction)')).toBeVisible()
        await expect(sim.getByText('E = 1.56 V')).toBeVisible()
        await sim.screenshot({ path: path.join(SCREEN_DIR, `c12u2-4-sim-default-${scheme}.png`) })

        // Au³⁺/Zn: n = 6 and a very large K.
        await selectReaction(page, 'Au³⁺ / Zn²⁺')
        await expect(sim.getByText(/× 10/).first()).toBeVisible()
        await expect(sim.getByText('Electrons transferred').locator('..')).toContainText('n = 6')
        await page.getByLabel('Progress to equilibrium').focus()
        await page.keyboard.press('PageUp')
        await page.keyboard.press('PageUp')
        await page.waitForTimeout(250)
        await sim.screenshot({ path: path.join(SCREEN_DIR, `c12u2-4-sim-au-zn-half-${scheme}.png`) })

        // Zn²⁺/Cu as written: E° negative, reverse verdict, then a temperature change.
        await selectReaction(page, 'Zn²⁺ / Cu²⁺ (as written, not spontaneous)')
        await expect(sim.locator('[data-verdict="reverse"]')).toContainText('Not spontaneous as written')
        await page.getByLabel('Temperature T').focus()
        await page.keyboard.press('PageUp')
        await page.keyboard.press('PageUp')
        await page.waitForTimeout(250)
        await sim.screenshot({ path: path.join(SCREEN_DIR, `c12u2-4-sim-zn-cu-reverse-${scheme}.png`) })

        expect(errors).toEqual([])
      })

      test(`progress reaches equilibrium with E = 0 (${scheme})`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto(`/dev/sim/${SIM}`)
        const sim = page.locator(`[data-simulation="${SIM}"]`)
        await page.getByLabel('Progress to equilibrium').focus()
        await page.keyboard.press('End')
        await expect(sim.getByText('E = 0.00 V')).toBeVisible()
        await expect(sim.getByText(/Equilibrium reached/)).toBeAttached()
        await expect(sim.getByText(/Infinity/)).toHaveCount(0)
      })
    })
  }

  test('text is at least 14 px and SVG labels stay inside the viewBox', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await selectReaction(page, 'Au³⁺ / Zn²⁺')
    await page.getByLabel('Progress to equilibrium').focus()
    await page.keyboard.press('End')
    await page.waitForTimeout(250)

    const small = await sim.evaluate((root) => {
      const bad: string[] = []
      for (const el of Array.from(root.querySelectorAll('*'))) {
        const own = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim())
        if (!own) continue
        if ((el.textContent ?? '').trim() === 'Simulation') continue // shell eyebrow, not this Simulation's text
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 14) bad.push(`${el.tagName}:${size}:${(el.textContent ?? '').trim().slice(0, 30)}`)
      }
      return bad
    })
    expect(small).toEqual([])

    const outside = await sim.locator('svg').evaluate((svg) => {
      const vb = (svg as SVGSVGElement).viewBox.baseVal
      const bad: string[] = []
      for (const el of Array.from(svg.querySelectorAll('text, rect, circle, line'))) {
        const box = (el as SVGGraphicsElement).getBBox()
        const tol = 1
        if (box.x < vb.x - tol || box.y < vb.y - tol || box.x + box.width > vb.x + vb.width + tol || box.y + box.height > vb.y + vb.height + tol) {
          bad.push(`${el.tagName}:${(el.textContent ?? '').slice(0, 20)}`)
        }
      }
      return bad
    })
    expect(outside).toEqual([])
  })

  test('phone width: no sideways scroll and the controls stay usable', async ({ page }) => {
    const errors = watchErrors(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim.getByText('Cathode (reduction)')).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
    await sim.screenshot({ path: path.join(SCREEN_DIR, `c12u2-4-sim-phone-${'light'}.png`) })
    expect(errors).toEqual([])
  })
})
