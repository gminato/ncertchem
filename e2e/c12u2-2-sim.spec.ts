import { test, expect, type Page } from '@playwright/test'

const SIM = 'half-cell-pairing'

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

const STATES = [
  { name: 'default', first: null, second: null, swap: false },
  { name: 'swapped', first: null, second: null, swap: true },
  { name: 'gas', first: 'Cl2/Cl-', second: 'Zn2+/Zn', swap: false },
  { name: 'alkali', first: 'Li+/Li', second: 'Cu2+/Cu', swap: false },
] as const

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Half-Cell Pairing Bench (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('pairs couples, swaps roles, and meets the text and bounds rules', async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/dev/sim/${SIM}`)
      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim).toBeVisible()

      for (const state of STATES) {
        if (state.first) await page.getByLabel('First couple').selectOption(state.first)
        if (state.second) await page.getByLabel('Second couple').selectOption(state.second)
        const swap = page.getByRole('switch', { name: /Swap the roles/ })
        if ((await swap.getAttribute('aria-checked')) !== String(state.swap)) await swap.click()

        const svg = sim.locator('svg').first()
        await expect(svg).toBeVisible()
        await expect(sim.locator('[aria-live="polite"]')).not.toBeEmpty()

        // Every drawn label renders at 14 px or more (KaTeX spacers excluded).
        const small = await svg.evaluate((el) =>
          Array.from(el.querySelectorAll('text'))
            .filter((t) => !t.closest('.katex') && (t.textContent ?? '').trim() !== '')
            .map((t) => ({ text: t.textContent, size: parseFloat(getComputedStyle(t).fontSize) }))
            .filter((t) => t.size < 14),
        )
        expect(small, `text under 14 px in ${state.name}`).toEqual([])

        // No drawn element leaves the SVG viewBox.
        const outside = await svg.evaluate((el) => {
          const vb = (el as SVGSVGElement).viewBox.baseVal
          const bad: string[] = []
          el.querySelectorAll('text, rect, circle, line, path').forEach((node) => {
            if (node.closest('defs')) return
            const b = (node as SVGGraphicsElement).getBBox()
            if (b.x < vb.x - 1 || b.y < vb.y - 1 || b.x + b.width > vb.x + vb.width + 1 || b.y + b.height > vb.y + vb.height + 1) {
              bad.push(`${node.tagName}:${(node.textContent ?? '').trim()}`)
            }
          })
          return bad
        })
        expect(outside, `elements outside the viewBox in ${state.name}`).toEqual([])

        await expect(page.locator('.katex-error')).toHaveCount(0)
        await sim.screenshot({ path: `test-results/screens/c12u2-2-sim-${state.name}-${scheme}.png` })
      }

      // The last state (Li+/Li against Cu2+/Cu) is spontaneous; swapping it must flip the verdict.
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Spontaneous as written')
      await page.getByRole('switch', { name: /Swap the roles/ }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Not spontaneous')
      expect(errors).toEqual([])
    })
  })
}
