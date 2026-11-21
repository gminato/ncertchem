import { test, expect, type Page } from '@playwright/test'

const SIM = '/dev/sim/electrolysis-product-predictor'
const SCRATCH_SHOTS = 'test-results/screens'

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

async function choose(page: Page, group: string, option: string) {
  await page.getByRole('radiogroup', { name: group }).getByRole('radio', { name: option, exact: true }).click()
}

/** Every visible text node in the Simulation renders at 14 px or more (skip the shell eyebrow). */
async function assertTextSizes(page: Page) {
  const small = await page.evaluate(() => {
    const root = document.querySelector('[data-sim-root], main') ?? document.body
    const out: string[] = []
    root.querySelectorAll<HTMLElement | SVGElement>('p, h3, li, span, div, label, button, text').forEach((el) => {
      const own = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
      )
      if (!own) return
      const text = (el.textContent ?? '').trim()
      if (text.toUpperCase() === 'SIMULATION' || /^[\s]*$/.test(text)) return
      const size = parseFloat(getComputedStyle(el).fontSize)
      if (size < 14) out.push(`${text.slice(0, 40)} (${size}px)`)
    })
    return out
  })
  expect(small).toEqual([])
}

/** Every SVG drawing element sits inside its viewBox (no clipped strokes or labels). */
async function assertInsideViewBox(page: Page) {
  const outside = await page.evaluate(() => {
    const bad: string[] = []
    document.querySelectorAll<SVGSVGElement>('svg[viewBox]').forEach((svg) => {
      const [vx, vy, vw, vh] = svg.getAttribute('viewBox')!.split(/\s+/).map(Number)
      const box = svg.getBoundingClientRect()
      const scale = Math.min(box.width / vw, box.height / vh)
      const ox = (box.width - vw * scale) / 2
      const oy = (box.height - vh * scale) / 2
      svg.querySelectorAll<SVGGraphicsElement>('text, circle, ellipse, rect, line, path, polyline').forEach((el) => {
        if (el.closest('defs')) return
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return
        const x0 = (r.left - box.left - ox) / scale + vx
        const y0 = (r.top - box.top - oy) / scale + vy
        const x1 = (r.right - box.left - ox) / scale + vx
        const y1 = (r.bottom - box.top - oy) / scale + vy
        if (x0 < vx - 1 || y0 < vy - 1 || x1 > vx + vw + 1 || y1 > vy + vh + 1) {
          bad.push(`${el.tagName} "${(el.textContent ?? '').trim().slice(0, 24)}" ${x0.toFixed(1)},${y0.toFixed(1)}..${x1.toFixed(1)},${y1.toFixed(1)}`)
        }
      })
    })
    return bad
  })
  expect(outside).toEqual([])
}

test.describe('Electrolysis Product Predictor (2.5.1)', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })

  for (const scheme of ['light', 'dark'] as const) {
    test(`default and changed states render in ${scheme}`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.emulateMedia({ colorScheme: scheme })
      const errors = watchErrors(page)
      await page.goto(SIM)
      const radios = page.getByRole('radiogroup', { name: 'Electrolyte' })
      await expect(radios).toBeVisible()
      await assertTextSizes(page)
      await assertInsideViewBox(page)

      // Default state: aqueous NaCl with inert electrodes.
      await expect(page.getByRole('radio', { name: 'Aqueous NaCl' })).toHaveAttribute('aria-checked', 'true')
      await expect(page.getByRole('region', { name: 'Competing half-reactions' })).toContainText('H⁺/H₂')
      await page.screenshot({ path: `${SCRATCH_SHOTS}/c12u2-8-sim-default-${scheme}.png`, fullPage: false })

      // Molten NaCl: no competition.
      await choose(page, 'Electrolyte', 'Molten NaCl')
      await expect(page.getByRole('region', { name: 'Competing half-reactions' })).toContainText('Only one cation')
      await page.screenshot({ path: `${SCRATCH_SHOTS}/c12u2-8-sim-molten-${scheme}.png` })

      // Dilute then concentrated H2SO4: O2 vs persulfate at the anode.
      await choose(page, 'Electrolyte', 'H₂SO₄')
      await choose(page, 'Acid strength', 'Concentrated')
      await expect(page.getByRole('region', { name: 'Competing half-reactions' })).toContainText('S₂O₈²⁻')
      await page.screenshot({ path: `${SCRATCH_SHOTS}/c12u2-8-sim-h2so4-conc-${scheme}.png` })

      // Copper sulphate with copper electrodes: the anode dissolves.
      await choose(page, 'Electrolyte', 'CuSO₄(aq)')
      await choose(page, 'Electrodes', 'Reactive')
      await expect(page.getByRole('region', { name: 'Competing half-reactions' })).toContainText('Dissolves')
      await page.screenshot({ path: `${SCRATCH_SHOTS}/c12u2-8-sim-cuso4-reactive-${scheme}.png` })

      await assertTextSizes(page)
      await assertInsideViewBox(page)
      expect(errors).toEqual([])
    })
  }

  test('no sideways scroll at 390 by 844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(SIM)
    await expect(page.getByRole('radiogroup', { name: 'Electrolyte' })).toBeVisible()
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(390)
  })
})
