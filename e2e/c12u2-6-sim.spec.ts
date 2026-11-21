import { test, expect, type Page } from '@playwright/test'

const SIM_URL = '/dev/sim/kohlrausch-lab'

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

test('Kohlrausch Lab does not scroll sideways at a 390 × 844 viewport', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(SIM_URL)
  const root = page.locator('[data-testid="kohlrausch-lab"]')
  await expect(root).toBeVisible()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
})

for (const scheme of ['light', 'dark'] as const) {
  test(`Kohlrausch Lab: controls, plot and text rules hold in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(SIM_URL)
    const root = page.locator('[data-testid="kohlrausch-lab"]')
    await expect(root).toBeVisible()
    await root.scrollIntoViewIfNeeded()
    await root.screenshot({ path: `test-results/screens/c12u2-6-sim-default-${scheme}.png` })

    // Learner adds two acetic acid points (both KCl points are always shown).
    await page.getByRole('button', { name: 'Add next acetic acid point' }).click()
    await page.getByRole('button', { name: 'Add next acetic acid point' }).click()
    const readout = root.locator('p[aria-live="polite"]').first()
    await expect(readout).toContainText('the two dilute Table 2.3 points')
    await expect(readout).toContainText('146.5')
    await root.screenshot({ path: `test-results/screens/c12u2-6-sim-plot-${scheme}.png` })

    // Ion builder: calcium with chloride gives CaCl₂ and Λ°m 271.6.
    await page.getByRole('radio', { name: 'Ca²⁺', exact: true }).click()
    await page.getByRole('radio', { name: 'Cl⁻', exact: true }).click()
    const result = root.locator('[aria-live="polite"]').nth(1)
    await expect(result).toContainText('CaCl₂')
    await expect(result).toContainText('271.6')
    await root.screenshot({ path: `test-results/screens/c12u2-6-sim-ions-${scheme}.png` })

    // Ion builder: H⁺ with CH₃COO⁻ is refused as a weak electrolyte.
    await page.getByRole('radio', { name: 'H⁺', exact: true }).click()
    await page.getByRole('radio', { name: 'CH₃COO⁻', exact: true }).click()
    await expect(result).toContainText('weak electrolyte')

    // Concentration slider: α and Ka change with c, and Ka stays 1.82 × 10⁻⁵ at every c.
    const slider = root.getByRole('slider')
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    const acetic = root.locator('[aria-live="polite"]').last()
    await expect(acetic).toContainText('mol L⁻¹')
    await expect(acetic).toContainText('1.82 × 10⁻⁵')
    await root.screenshot({ path: `test-results/screens/c12u2-6-sim-conc-${scheme}.png` })

    // Every text element is at least 14 px computed size.
    const smallText = await root.evaluate((el) => {
      const out: string[] = []
      el.querySelectorAll('*').forEach((node) => {
        const direct = Array.from(node.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
        )
        if (!direct) return
        const size = parseFloat(getComputedStyle(node).fontSize)
        if (size < 14) out.push(`${node.tagName} "${node.textContent?.trim().slice(0, 30)}" ${size}px`)
      })
      return out
    })
    expect(smallText).toEqual([])

    // Every drawn SVG element sits inside its SVG (checked on screen, so rotated labels count).
    const outside = await root.locator('svg').evaluate((svg) => {
      const box = svg.getBoundingClientRect()
      const bad: string[] = []
      svg.querySelectorAll('text, circle, line, path, rect').forEach((node) => {
        const r = node.getBoundingClientRect()
        if (r.left < box.left - 0.5 || r.top < box.top - 0.5 || r.right > box.right + 0.5 || r.bottom > box.bottom + 0.5) {
          bad.push(`${node.tagName} "${node.textContent?.trim().slice(0, 20) ?? ''}"`)
        }
      })
      return bad
    })
    expect(outside).toEqual([])

    expect(errors).toEqual([])
  })
}
