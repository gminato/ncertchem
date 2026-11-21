import { test, expect, type Page } from '@playwright/test'

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

for (const scheme of ['light', 'dark'] as const) {
  test(`Lead–acid battery cycle: states, rules and labels in ${scheme}`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    const errors = watchErrors(page)

    await page.goto('/dev/sim/lead-acid-cycle')
    const sim = page.locator('article').first()
    await expect(sim.locator('svg')).toHaveCount(1)
    await sim.scrollIntoViewIfNeeded()

    // Default state: discharging at 1.50 h.
    await sim.screenshot({ path: `test-results/screens/c12u2-9-sim-default-${scheme}.png` })
    await expect(page.getByText('Anode, oxidation (Pb plate)')).toBeVisible()

    // Recharge at the end of the slider: lead regenerated, electrode roles swap.
    await page.getByText('Recharge (charger forces current)').click()
    const slider = page.getByRole('slider', { name: /Time at/ })
    await slider.focus()
    await page.keyboard.press('End')
    await expect(page.locator('dd', { hasText: '23.19 g' })).toBeVisible()
    await expect(page.getByText('Anode, oxidation (PbO₂ plate)')).toBeVisible()
    await sim.screenshot({ path: `test-results/screens/c12u2-9-sim-recharge-full-${scheme}.png` })

    // Discharge at the end of the slider: same charge, roles back to discharge.
    await page.getByText('Discharge (cell supplies current)').click()
    await slider.focus()
    await page.keyboard.press('End')
    await expect(page.locator('dd', { hasText: '23.19 g' })).toBeVisible()
    await sim.screenshot({ path: `test-results/screens/c12u2-9-sim-discharge-full-${scheme}.png` })

    // Every text element is at least 14 px.
    const small = await page.evaluate(() => {
      const out: string[] = []
      document.querySelectorAll('article *').forEach((el) => {
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim())
        if (!hasText) return
        const text = (el.textContent ?? '').trim()
        if (text.toLowerCase() === 'simulation') return
        if (parseFloat(getComputedStyle(el).fontSize) < 14) out.push(text)
      })
      return out
    })
    expect(small).toEqual([])

    // No drawn element leaves the SVG bounds.
    const outside = await page.evaluate(() => {
      const bad: string[] = []
      document.querySelectorAll('article svg').forEach((svg) => {
        const box = svg.getBoundingClientRect()
        svg.querySelectorAll('*').forEach((el) => {
          if (el.closest('defs, clipPath, mask, marker, pattern, linearGradient, radialGradient')) return
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) return
          const tol = 2
          if (r.left < box.left - tol || r.right > box.right + tol || r.top < box.top - tol || r.bottom > box.bottom + tol) {
            bad.push(`${el.tagName} ${(el.textContent ?? '').trim().slice(0, 30)}`)
          }
        })
      })
      return bad
    })
    expect(outside).toEqual([])

    expect(errors).toEqual([])
  })
}

test('Lead–acid battery cycle fits a 390 px phone without sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dev/sim/lead-acid-cycle')
  await expect(page.locator('article svg')).toHaveCount(1)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
})
